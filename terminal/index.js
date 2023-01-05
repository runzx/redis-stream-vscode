const { window } = require("vscode")
const Pty = require("./pty")


class Terminal {

  constructor(context) {
    this.context = context
    this.terminals = new Map()
  }

  start(redisItem) {
    if (!this.terminals.has(redisItem.id)) {
      this.create(redisItem)
    }
    const t = this.terminals.get(redisItem.id)
    t && t.show()
  }

  create(redisItem) {
    const terminal = window.createTerminal({
      name: 'redis-' + redisItem.id,
      pty: new Pty(redisItem,
        () => this.close(redisItem.id),
        this.context)
    })

    this.terminals.set(redisItem.id, terminal)
  }

  close(id) {
    this.terminals.get(id).dispose()
    this.terminals.delete(id)
  }
}

module.exports = Terminal