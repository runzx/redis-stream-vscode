

const vscode = require("vscode")
// const { RedisModel } = require("../command/redis")
const { scheme } = require("../config")
const { createLogger } = require('../lib/logging')

const log = createLogger('doc:virtual')
const cacheDoc = {}

class DocProvider {
  constructor() {
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
  }
  async provideTextDocumentContent(uri) {
    const { path, scheme } = uri
    log.info('uri', scheme, path)
    // let [connection, db, type, strem, group, consumer, key] = path.split('$')
    let k = path.match(/(.+)\.(\w+)/)
    if (k?.[2] === 'json') {
      return this.fmt(cacheDoc[k[1]], k[1])
    }
    // txt, path: 'redisServerInfo.txt'
    return cacheDoc[k?.[1] || path]
  }
  refresh(uri) {
    this._onDidChange.fire(uri)
  }
  fmt(msg = '', key) {
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

class VirtualDoc {
  constructor(context) {
    this.scheme = scheme.VIEW_DOCUMENT_SCHEME
    this.subscriptions = context.subscriptions
  }
  initProvider() {
    this.provider = new DocProvider()

    this.subscriptions.push(vscode.workspace
      .registerTextDocumentContentProvider(this.scheme, this.provider))
  }
  showDoc(id) {
    vscode.window
      .showTextDocument(this.getUri(id), { preview: false })
    return this
  }
  getUri(id) {
    if (id === 'redisServerInfo')
      return vscode.Uri.parse(`${this.scheme}:${id}.txt`)
    return vscode.Uri.parse(`${this.scheme}:${id}.json`)
  }
  update(id) {
    this.provider.refresh(this.getUri(id))
  }
  dispose() { }

  static init({ context }) {
    const v = new VirtualDoc(context)
    v.initProvider()
    return v
  }
  static setCacheDoc(key, value) {
    return cacheDoc[key] = value
  }
  static getCacheDoc(key, value) {
    if (cacheDoc[key]) return cacheDoc[key]
    return value
  }
}

module.exports = exports = { VirtualDoc, }

exports.setCacheDoc = (key, value) => {
  return cacheDoc[key] = value
}

exports.getCacheDoc = (key, value) => {
  if (cacheDoc[key]) return cacheDoc[key]
  return cacheDoc[key] = value
}