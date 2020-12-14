

const vscode = require("vscode")
const { redisModel } = require("../command/redis")
const { log } = require("../lib/logging")


class DocProvider {
  constructor(scheme, txt) {
    this.scheme = scheme
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
    this.txt = txt
  }
  async provideTextDocumentContent(uri) {
    log('URI', uri)
    const { path } = uri
    let res
    let [connection, db, type, key] = path.split('$')
    if (this.txt) {
      res = this.txt
    } else {
      key = key.replace('.json', '')
      res = await redisModel.getKey(key, db)
    }

    if (typeof res === 'string') {
      try {
        res = JSON.parse(res)
      } catch (err) {
        res = { [key]: res }
      }
    } else { }
    return JSON.stringify(res, null, 2)
  }
}
class VirtualDoc {
  constructor(scheme, context) {
    this.scheme = scheme
    this.subscriptions = context.subscriptions
    this.uri
  }
  initProvider(txt) {
    this.provider = new DocProvider(this.scheme, txt)
    this.subscriptions.push(vscode.workspace
      .registerTextDocumentContentProvider(this.scheme, this.provider))
  }
  async showDoc(id) {
    const uri = vscode.Uri.parse(`${this.scheme}:${id}`)
    const doc = await vscode.workspace
      .openTextDocument(uri)
    await vscode.window
      .showTextDocument(doc, { preview: false })
  }
  update() {
    this.provider.onDidChange.fire(this.uri)
  }
  static init(scheme, context, txt) {
    const v = new VirtualDoc(scheme, context)
    v.initProvider(txt)
    return v
  }
  dispose() { }
}

module.exports = { VirtualDoc }