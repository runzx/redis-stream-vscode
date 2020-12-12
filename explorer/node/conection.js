const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { showMsg } = require("../../lib/show-message")
const { log } = require("../../lib/logging")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { redisModel } = require("../../command/redis")


class ConnectionNode extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      connection: opt.label || '127.0.0.1@6379',
      ...opt
    }
    this.contextValue = NodeType.CONNECTION
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  async getChildren() {
    console.log('connection getChildren:',)

    const dbs = await redisModel.info()
    log('dbs', dbs,)
    return Object.keys(dbs).map(label => {
      const { keys, expires, avg_ttl } = dbs[label]
      return new DbTreeItem({
        connection: this.config.connection,
        id: 'id:' + label, description: `(${keys})`,
        label, tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      })
    })
  }

}

module.exports = { ConnectionNode }