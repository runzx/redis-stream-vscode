const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")


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
  }
  async getChildren() {
    return this.config.items.map(label => {
      const data = {
        connection: this.config.connection,
        db: this.config.db,
        redisDataType: this.redisDataType,
        contextValue: NodeType.KEY,
        label,
      }
      return new KeyTreeItem(data)
    })
  }
}

module.exports = { RedisDateTypes }