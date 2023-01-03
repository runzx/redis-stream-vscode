const vscode = require('vscode')
const { registerCommand } = vscode.commands
const { RedisTree } = require('../explorer')
const { createLogger } = require('../lib/logging')
const { initVdoc, cacheSetVdoc } = require('../editor/v-doc')
// const showStatusBar = require('../lib/status-view')

const log = createLogger('register redis')

exports.registers = (context) => {
  const { subscriptions } = context
  const register = (commandName, cb) => {
    subscriptions.push(registerCommand(commandName, cb))
  }
  // const statusBar = new showStatusBar(context, 'right')

  new RedisTree(context)

  const doc = initVdoc({ context })

  // register('redis-stream.key.status', async (opt) => {
  //   doc.showDoc(opt.id)
  // })

  register('redis-stream.key.value.refresh', async (opt) => {
    doc.update(opt.id)
    opt.refresh(opt)
  })

  register('redis-stream.id.status', async (opt) => {
    doc.showDoc(opt.id)
  })

  register('redis-stream.msg.value.refresh', async (opt) => {
    await opt.refresh(opt, (item) => {
      cacheSetVdoc(opt.id, item)
      doc.update(opt.id)
    })
  })

  log.info('globalState:', ...context.globalState.keys())
  log.info('workspaceState:', ...context.workspaceState.keys())
}