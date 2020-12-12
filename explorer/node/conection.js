const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { showMsg } = require("../../lib/show-message")
const { log } = require("../../lib/logging")
const { RedisBase } = require("../../lib/redis-mq")
const { TreeItemCollapsibleState } = require("vscode")


class ConnectionNode extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      ...opt
    }
    this.contextValue = NodeType.CONNECTION
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)
    // this.command = {
    //   title: 'Info',
    //   tooltip: 'redis server info',
    //   arguments: [],
    //   command: 'redis-stream.connection.status'
    // }
  }
  async getChildren() {
    console.log('connection Node:',)
    const redis = new RedisBase()
    const [serverInfo, dbs, InfoTxt] = await redis.serverInfo()
    log('dbs', dbs,)
    return Object.keys(dbs).map(label => {
      const { keys, expires, avg_ttl } = dbs[label]
      return {
        label, tooltip: `keys:${keys},expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      }
    })
  }

}

module.exports = { ConnectionNode }