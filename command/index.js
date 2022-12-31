
const vscode = require('vscode')
const { registerCommand } = vscode.commands
// const showStatusBar = require('../lib/status-view')
const { RedisTree } = require('../explorer')
const { VirtualDoc } = require('../editor')
const { KeyView } = require('../editor/key-doc')
const { StreamIdView } = require('../editor/stream-id-doc')
const { createLogger } = require('../lib/logging')
const { initVdoc, showVdoc } = require('../editor/v-doc')

const log = createLogger('register redis')

exports.registers = (context) => {
  const { subscriptions } = context
  const register = (commandName, cb) => {
    subscriptions.push(registerCommand(commandName, cb))
  }
  // const statusBar = new showStatusBar(context, 'right')

  new RedisTree(context)

  const doc = initVdoc({ context })
  // const doc = KeyView.init({ context })
  register('redis-stream.key.status', async (opt) => {
    // opt.vDocView.showDoc(opt.id)
    // showVdoc(opt)
    // const { id } = opt
    // // log.info('KEY', label, id)
    doc.showDoc(opt.id)
  })
  register('redis-stream.key.value.refresh', async (opt) => {
    const { id, refresh } = opt
    // log.info('VALUE RELOAD', label, id)
    doc.update(id)
    refresh(opt)
  })

  const docId = StreamIdView.init({ context })
  register('redis-stream.id.status', async (opt) => {
    const { id } = opt
    // log.info('DocID', label, id)
    docId.showDoc(id)
  })

  const virDoc = VirtualDoc.init({ context })
  register('redis-stream.msg.value.refresh', async (opt) => {
    const { id, refresh } = opt
    // log.info('VALUE RELOAD', label, id)
    await refresh(opt, (item) => {
      VirtualDoc.setCacheDoc(id, item)
      virDoc.showDoc(id)
      virDoc.update(id)
    })

  })

  log.info('globalState:', ...context.globalState.keys())
  log.info('workspaceState:', ...context.workspaceState.keys())

}