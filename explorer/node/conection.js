const { NodeType, Constant } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { log } = require("../../lib/logging")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { RedisModel } = require("../../command/redis")
const { showMsg } = require("../../lib/show-message")

class ConnectionNode extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.host = opt.host
    this.port = opt.port
    this.password = opt.password
    this.dbs = opt.dbs
  }
  static async init(opt = {}) {
    const { host, port, password } = opt
    opt.contextValue = NodeType.CONNECTION
    opt.collapsibleState = TreeItemCollapsibleState.Expanded
    opt.label = opt.connection = opt.id = `${host}:${port}`

    if (!host && !port && !password) log('refresh err', opt)
    const redisModel = RedisModel.init({ host, port, password, db: 0 })
    const dbs = await redisModel.info()
      .catch(err => {
        showMsg(err.message + '  -- refresh redis host:port --', 'error')
        log('Redis status', redisModel.status)
        opt.collapsibleState = TreeItemCollapsibleState.None
      })
    log('dbs', dbs,)
    opt.redisModel = redisModel
    opt.dbs = dbs
    return [new ConnectionNode(opt)]
  }
  async getChildren() {

    return Object.keys(this.dbs).map(label => {
      const { keys, expires, avg_ttl } = this.dbs[label]
      const db = +label.match(/(\d+)/)[1]
      const { connection, host, port, password, context } = this
      return DbTreeItem.init({
        db, connection, label, host, port, password, context,
        redisModel: db === 0 ? this.redisModel : null,
        description: `(${keys})`,
        tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      })
    })
  }

}

module.exports = { ConnectionNode }