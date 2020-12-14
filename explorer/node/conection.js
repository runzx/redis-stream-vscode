const { NodeType, Constant } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { log } = require("../../lib/logging")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { redisModel, RedisModel } = require("../../command/redis")
const { showMsg } = require("../../lib/show-message")

class ConnectionNode extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)

  }
  static async init(opt = {}) {
    const { host, port, password, db = 0 } = opt
    opt.contextValue = NodeType.CONNECTION
    opt.collapsibleState = TreeItemCollapsibleState.Expanded
    opt.label = opt.connection = opt.id = `${host}:${port}`

    if (host && port) {
      await redisModel.restart({ host, port, password, db })
        .catch(err => {
          showMsg(err.message + '  -- refresh redis host:port --', 'error')
          log('Redis status', redisModel.redisClient.status)
          opt.collapsibleState = TreeItemCollapsibleState.None
        })
    }

    return [new ConnectionNode(opt)]
  }
  async getChildren() {
    const dbs = await redisModel.info()
    log('dbs', dbs,)
    return Object.keys(dbs).map(label => {
      const { keys, expires, avg_ttl } = dbs[label]
      return DbTreeItem.init({
        connection: this.connection,
        db: +label.match(/(\d+)/)[1],
        description: `(${keys})`,
        label, tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      })
    })
  }

}

module.exports = { ConnectionNode }