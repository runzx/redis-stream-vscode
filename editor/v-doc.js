/**
 * 显示 普通 key, stream key, text 内容 
 * 翟享20221231
 */
const vscode = require("vscode")
const { RedisModel } = require("../command/redis")
const { scheme } = require("../config")
const { VIEW_DB_KEY_SCHEME, VIEW_STREM_ID_SCHEME, VIEW_STREM_KEY_SCHEME } = scheme
const { createLogger } = require('../lib/logging')

const log = createLogger('doc:key')
const content = new Map() // cache doc


class DocProvider {
  constructor() {
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
  }
  async provideTextDocumentContent(uri) {
    const { path, scheme } = uri
    log.info('uri', scheme, path)
    let [name, db, type, key, extension] = path.split('.')
    let result = ''
    switch (type) {
      case 'text':
        result = content.get([name, db, type, key].join('.')) || '没有连接上 redis 服务'
        break;

      case VIEW_STREM_ID_SCHEME:  // stream-id
        // let [connection, db, type, key,] = path.split('$')
        let [, id] = path.match(/\$(\d+-?\d*)\.json/) || []
        result = await RedisModel.getRedisModel(`${name}:${db}`).getInfoById(id, key)
        result = this.fmt(result, id)
        break;

      case 'stream':
      case 'search':
      default:   // string, set, ...
        result = await RedisModel.getRedisModel(`${name}:${db}`).getKey(key)
        result = this.fmt(result, key)
        break;
    }
    return result
  }
  refresh(uri) {
    this._onDidChange.fire(uri)
  }
  fmt(msg, key) {
    if (!msg) return 'no key!'
    if (typeof msg === 'string') {
      try {
        msg = JSON.parse(msg)
      } catch (err) {
        msg = { [key]: msg }
      }
    } else { }
    return JSON.stringify(msg, null, 2)
  }
}

class DocView {
  constructor(opt) {
    this.opt = opt
    this._initProvider(opt)
  }
  _initProvider(opt) {
    this.provider = opt.provider ? opt.provider : new DocProvider()
    opt.context.subscriptions.push(vscode.workspace
      .registerTextDocumentContentProvider(VIEW_DB_KEY_SCHEME, this.provider))
  }

  showDoc(id, extension) {
    return vscode.window
      .showTextDocument(this._getUri(id, extension), { preview: false })
  }

  update(id) {
    this.provider.refresh(this._getUri(id))
  }

  _getUri(id, extension = '.json') {
    return vscode.Uri.parse(`${VIEW_DB_KEY_SCHEME}:${id}${extension}`)
  }


  dispose() { }
}

exports.VirtualDocView = DocView
let docView
exports.initVdoc = (opt) => {
  if (!docView) docView = new DocView(opt)
  return docView
}

exports.cacheSetVdoc = (key, value) => {
  return content.set(key, value)
}