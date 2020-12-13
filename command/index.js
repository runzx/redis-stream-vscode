
const vscode = require('vscode')
const { registerCommand, registerTextEditorCommand } = vscode.commands
const { showMsg, showModal } = require('../lib/show-message')
const showStatusBar = require('../lib/status-view')
const log = require('../lib/logging')('registers')

// 引入 tree
const { RedisTree } = require('../explorer')
const { VirtualDoc } = require('../editor')
const { channel } = require('../config')


exports.registers = (context) => {
  const { subscriptions } = context
  const register = (commandName, cb) => {
    subscriptions.push(registerCommand(commandName, cb))
  }
  const statusBar = new showStatusBar(context, 'right')
  log.info('first register command...')
  // 下面是要注册的命令
  register('redis-stream.hide', () => {
    context.globalState.update('redisOpt', { host: "127.0.0.1", port: 6379 })

  })


  new RedisTree(context)
  const doc = VirtualDoc.init(channel, context)
  register('redis-stream.openDoc', (uri) => doc.showDoc(uri))


}