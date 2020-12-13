const { NodeType, Constant } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { log } = require("../../lib/logging")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { redisModel } = require("../../command/redis")


class ConnectionNode extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)

  }
  static init(opt = {}) {
    const { host, port, password, db = 0 } = opt
    opt.contextValue = NodeType.CONNECTION
    opt.collapsibleState = TreeItemCollapsibleState.Expanded
    opt.label = opt.connection = `${host}:${port}`
    try {
      if (host && port) {
        redisModel.start(opt)
        // this.cacheSet(Constant.GLOBALSTATE_CONFIG_KEY, { host, port, password, db })

        return [new ConnectionNode(opt)]
      }
    } catch (err) {
      console.log('err:', err)
    }
    return []
  }
  async getChildren() {
    const dbs = await redisModel.info()
    log('dbs', dbs,)
    return Object.keys(dbs).map(label => {
      const { keys, expires, avg_ttl } = dbs[label]
      return DbTreeItem.init({
        connection: this.connection,
        id: 'id:' + label, description: `(${keys})`,
        label, tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      })
    })
  }

}

module.exports = { ConnectionNode }