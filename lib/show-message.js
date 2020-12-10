
const { showInformationMessage, showErrorMessage, showWarningMessage } = require('vscode').window


exports.showMsg = class ShowMessage {
  constructor() {

  }
  static info(msg) {
    showInformationMessage(msg)
  }
  static warn(msg) {
    showInformationMessage(msg)
  }
  static error(msg) {
    showInformationMessage(msg)
  }
}

