/*
 * @Author: xiang.zhai 
 * @Date: 2020-12-10 08:02:46 
 * @Last Modified by: zx.B450
 * @Last Modified time: 2020-12-10 11:57:39
 * 在状态栏输出 
 * 
 */

const vscode = require("vscode")

class StatusView {
  constructor(context, alig = 'left') {
    this._statusBarItem = vscode.window.createStatusBarItem(alig === 'left?' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right, 0)
    context.subscriptions.push(this._statusBarItem)
  }

  showMessage(message) {
    this._statusBarItem.text = message
    this._statusBarItem.show()
  }

  hideMessage() {
    this._statusBarItem.hide()
  }

  get text() {
    return this._statusBarItem.text
  }
}

module.exports = StatusView