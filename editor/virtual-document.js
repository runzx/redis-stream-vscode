

const vscode = require("vscode")
const { redisModel } = require("../command/redis")
const { log } = require("../lib/logging")


class DocProvider {
  constructor(scheme) {
    this.scheme = scheme
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
  }
  async provideTextDocumentContent(uri) {
    // simply invoke cowsay, use uri-path as text
    log('URI', uri)
    const { path } = uri
    let [connection, db, type, key] = path.split('_')
    key = key.replace('.json', '')
    let res = await redisModel.getKey(key, db)
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

    // this._documents = new Map()
    // this._editorDecoration = window.createTextEditorDecorationType({ textDecoration: 'underline' })
    // this._subscriptions = workspace.onDidCloseTextDocument(doc =>
    //   this._documents.delete(doc.uri.toString()))
  }

  initProvider() {
    this.provider = new DocProvider(this.scheme)
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
  static init(scheme, context) {
    const v = new VirtualDoc(scheme, context)
    v.initProvider()
    return v
  }
  dispose() {
    this._subscriptions.dispose()
    this._documents.clear()
    this._editorDecoration.dispose()
    this._onDidChange.dispose()
  }
}

module.exports = { VirtualDoc }