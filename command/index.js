
const vscode = require('vscode')
const { registerCommand, registerTextEditorCommand } = vscode.commands
const { showMsg, showModal } = require('../lib/show-message')
const showStatusBar = require('../lib/status-view')
const log = require('../lib/logging')('registers')



exports.registers = (context) => {
  const { subscriptions } = context
  const register = (commandName, cb) => {
    subscriptions.push(registerCommand(commandName, cb))
  }
  const statusBar = new showStatusBar(context, 'right')
  log.info('first register command...')
  // 下面是要注册的命令
  register('redis-stream.helloWorld', () => {
    log.info('active command: helloWorld', 'error')
    let res = statusBar.text
    statusBar.showMessage('状态栏中文测试.....')

    showMsg('Hello World from redis-stream!')
    showMsg('warning from redis-stream!', 'warning')
    showMsg('error from redis-stream!', 'error')
  })

  register('redis-stream.hide', () => {
    showModal('要隐藏状态栏显示?', 'yes', 'no', 'or')
      .then(res => {
        if (res === 'yes') statusBar.hideMessage()
      })

  })


}