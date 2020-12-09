
const vscode = require("vscode")

class StatusView {
  constructor(context) {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
    context.subscriptions.push(this._statusBarItem)
  }
  showMessage(message) {
    this._statusBarItem.text = message
    this._statusBarItem.show()
  }
  hideMessage() {
    this._statusBarItem.hide()
  }
}

module.exports = StatusView