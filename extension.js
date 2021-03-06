/*
 * @Author: xiang.zhai 
 * @Date: 2020-12-10 09:57:42 
 * @Last Modified by: zx.B450
 * @Last Modified time: 2020-12-10 12:03:04
 * vscode 扩展开发框架	翟享
 * 
 */

const vscode = require('vscode')

const { registers } = require('./command')
const { channel } = require('./config')
/**
 * @param {vscode.ExtensionContext} context
 */
exports.activate = (context) => {
	// This line of code will only be executed once when your extension is activated
	console.log(`\nCongratulations, your extension "${channel}" is now active!\n`)

	registers(context)
}

exports.deactivate = () => { }
