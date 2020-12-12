

const vscode = require("vscode")


class DocProvider {
  constructor(scheme) {
    this.scheme = scheme
    this._onDidChange = new vscode.EventEmitter()
    this.onDidChange = this._onDidChange.event
  }
  provideTextDocumentContent(uri) {
    // simply invoke cowsay, use uri-path as text
    return 'cowsay.say({ text: uri.path })'
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
    this.subscriptions(vscode.workspace
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
    return new VirtualDoc(scheme, context)
  }
  dispose() {
    this._subscriptions.dispose()
    this._documents.clear()
    this._editorDecoration.dispose()
    this._onDidChange.dispose()
  }
}

module.exports = { VirtualDoc }