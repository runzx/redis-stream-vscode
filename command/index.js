
const vscode = require('vscode')
const { registerCommand, registerTextEditorCommand } = vscode.commands
const { showMsg } = require('../lib/show-message')
const showStatusBar = require('../lib/status-view')
const log = require('../lib/logging')('registers')



exports.registers = (context) => {
  const { subscriptions } = context
  const register = (commandName, cb) => {
    subscriptions.push(registerCommand(commandName, cb))
  }
  const statusBar = new showStatusBar(context)
  log.info('first register command...')
  // 下面是要注册的命令
  register('redis-stream.helloWorld', () => {
    log.info('active command: helloWorld')
    let res = statusBar.text
    statusBar.showMessage('heheh.....')

    showMsg.info('Hello World from redis-stream!')
  })

  register('redis-stream.hide', () => {
    statusBar.hideMessage()
  })


}