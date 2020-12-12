const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")
const path = require('path')

class RedisDateTypes extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      redisDataType: RedisType.string,
      items: [],
      ...opt
    }
    this.contextValue = NodeType.REDISDATATYPE
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  async getChildren() {

    return this.config.items.map(label => {

      return new KeyTreeItem({
        connection: this.config.connection,
        db: this.config.db,
        redisDataType: this.config.redisDataType,
        // id: 'id:' + label, description: `(${keys})`,
        label,
        // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: TreeItemCollapsibleState.None
      })
    })
  }
}

module.exports = { RedisDateTypes }