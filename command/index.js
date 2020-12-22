
const vscode = require('vscode')
const { registerCommand, registerTextEditorCommand } = vscode.commands
const { showMsg, showModal } = require('../lib/show-message')
const showStatusBar = require('../lib/status-view')
const log = require('../lib/logging')('registers')


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

  new RedisTree(context)

  const doc = KeyView.init({ context })
  register('redis-stream.key.status', async (opt) => {
    const { label, id } = opt
    log.info('KEY', label, id)
    doc.showDoc(id)
  })
  register('redis-stream.key.value.refresh', async (opt) => {
    const { label, id, refresh } = opt
    log.info('VALUE RELOAD', label, id)
    doc.update(id)
    refresh(opt)
  })

  const docId = StreamIdView.init({ context })
  register('redis-stream.id.status', async (opt) => {
    const { label, id } = opt
    log.info('DocID', label, id)
    docId.showDoc(id)
  })

  const virDoc = VirtualDoc.init({ context })
  register('redis-stream.msg.value.refresh', async (opt) => {
    const { label, id } = opt
    log.info('VALUE RELOAD', label, id)
    virDoc.update(id)
  })
}