
const vscode = require('vscode')
const { registerCommand, registerTextEditorCommand } = vscode.commands
const { showMsg, showModal } = require('../lib/show-message')
const showStatusBar = require('../lib/status-view')
const log = require('../lib/logging')('registers')

// 引入 tree
const { RedisTree } = require('../explorer')
const { VirtualDoc } = require('../editor')
const { channel, scheme } = require('../config')
const { KeyView } = require('../editor/key-doc')
const { StreamIdView } = require('../editor/stream-id-doc')


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
  const doc = KeyView.init({ context })
  register('redis-stream.openDoc', (uri) => doc.showDoc(uri))
  register('redis-stream.key.status', async (opt) => {
    const { label, id } = opt
    log.info('KEY', label, id)
    doc.showDoc(id)
  })

  const docId = StreamIdView.init({ context })
  register('redis-stream.id.status', async (opt) => {
    const { label, id } = opt
    log.info('DocID', label, id)
    docId.showDoc(id)
  })

  const virDoc = VirtualDoc.init({ context })
  register('redis-stream.id.value.refresh', async (opt) => {
    const { label, id, refresh } = opt
    log.info('VALUE RELOAD', label, id)
    doc.update(id)
    refresh(opt)
    
  })
  register('redis-stream.msg.value.refresh', async (opt) => {
    const { label, id } = opt
    log.info('VALUE RELOAD', label, id)
    virDoc.update(id)
  })
}