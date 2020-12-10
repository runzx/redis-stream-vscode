
const { showInformationMessage, showErrorMessage, showWarningMessage } = require('vscode').window


exports.showMsg = (msg, type = 'info') => {
  type === 'info' && showInformationMessage(msg)
  type === 'warning' && showWarningMessage(msg)
  type === 'error' && showErrorMessage(msg)
}
// promise
exports.showModal = (msg, ...items) => {
  return showInformationMessage(msg, ...items)
}
