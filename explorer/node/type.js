const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")
const path = require('path')


class RedisDateTypes extends TreeDataItem {
  constructor({
    contextValue = NodeType.REDISDATATYPE,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      items: [],
      redisDataType: RedisType.string,
      ...opt
    }
    // this.contextValue = NodeType.REDISDATATYPE
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  async getChildren() {

    return this.config.items.map(label => {
      const data = {
        connection: this.config.connection,
        db: this.config.db,
        redisDataType: this.redisDataType,
        contextValue: NodeType.KEY,
        // id: 'id:' + label, description: `(${keys})`,
        label,
        // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        // collapsibleState: TreeItemCollapsibleState.None
      }

      return new KeyTreeItem(data)
    })
  }
}

module.exports = { RedisDateTypes }