/*
 * @Author: xiang.zhai 
 * @Date: 2020-12-10 09:57:42 
 * @Last Modified by: zx.B450
 * @Last Modified time: 2022-01-29 21:55:43
 * vscode 扩展开发框架	翟享
 * 
 */

const vscode = require('vscode')

const { registers } = require('./command')
const { channel } = require('./config')
const { createLogger } = require('./lib/logging')

const log = createLogger('start')
/**
 * @param {vscode.ExtensionContext} context
 */
exports.activate = (context) => {
  // This line of code will only be executed once when your extension is activated
  log.info(`'${channel}'`, 'active!')

  registers(context)
}

exports.deactivate = () => { }
