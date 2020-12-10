/*
 * @Author: xiang.zhai 
 * @Date: 2020-12-10 11:51:23 
 * @Last Modified by: zx.B450
 * @Last Modified time: 2020-12-10 12:11:10
 * 显示 延时5-10s 隐藏
 * 隐藏后第2次showMadal 才会返回 上次的 undefined
 */

const { showInformationMessage, showErrorMessage, showWarningMessage } = require('vscode').window


exports.showMsg = (msg, type = 'info') => {
  type === 'info' && showInformationMessage(msg)
  type === 'warning' && showWarningMessage(msg)
  type === 'error' && showErrorMessage(msg)
}
// promise,return chiose from items
exports.showModal = (...msg) => {
  return showInformationMessage(...msg)
}
