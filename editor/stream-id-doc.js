

const vscode = require("vscode")
const { RedisModel } = require("../command/redis")
const { scheme } = require("../config")
const { log } = require("../lib/logging")
const { VIEW_STREM_ID_SCHEME } = scheme

class DocProvider {
  constructor() {
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
  }
  async provideTextDocumentContent(uri) {
    log('URI', uri)
    const { path } = uri
    let [connection, db, type, key,] = path.split('$')
    let [, id] = path.match(/\$(\d+-?\d*)\.json/) || []

    const redisModel = RedisModel.init({ connection, db, })
    let res = await redisModel.getInfoById(id, key)
    return this.fmt(res, id)
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
class StreamIdView {
  constructor(context, scheme = VIEW_STREM_ID_SCHEME) {
    this.scheme = scheme
    this.subscriptions = context.subscriptions
  }
  initProvider(opt) {
    if (opt.provider) this.provider = opt.provider
    else this.provider = new DocProvider(opt)

    this.subscriptions.push(vscode.workspace
      .registerTextDocumentContentProvider(this.scheme, this.provider))
  }
  showDoc(id) {
    return vscode.window
      .showTextDocument(this.getUri(id), { preview: false })
  }
  getUri(id) {
    return vscode.Uri.parse(`${this.scheme}:${id}.json`)
  }
  update(id) {
    this.provider.refresh(this.getUri(id))
  }
  dispose() { }

  static getScheme(db, connection = '') {
    // connection.replace(':', '_')
    return VIEW_STREM_ID_SCHEME
    // `${VIEW_DB_KEY_SCHEME}_${connection}_${db}`
  }

  static init({ context, redisModel, db,
    connection = '', provider }) {
    const schemeKey = this.getScheme(db, connection)
    const v = new StreamIdView(context, schemeKey)
    v.initProvider({ provider })
    return v
  }


}

module.exports = { StreamIdView }