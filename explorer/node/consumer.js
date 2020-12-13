const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")
const path = require('path')
const { StreamPending } = require("./pending")

class StreamConsumer extends TreeDataItem {
  constructor({
    contextValue = NodeType.CONSUMER,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      redisDataType: RedisType.string,
      connection: '127.0.0.1@6379',
      db: 'db0',
      item: null,
      stream: '', // stream key
      group: '', // group key

      ...opt
    }
    // this.contextValue = NodeType.CONSUMER
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  async getChildren() {
    const data = {
      connection: this.config.connection,
      db: this.config.db,
      redisDataType: this.redisDataType,
      contextValue: NodeType.CONSUMER,
      stream: this.config.stream,
      group: this.config.group,
      consumer: this.label,
      collapsibleState: TreeItemCollapsibleState.Collapsed
    }

    const { pending } = this.config.item
    data.item = pending
    data.label = 'pending'
    data.contextValue = NodeType.PENDING
    data.tooltip = 'pending length: ' + pending.length
    return [new StreamPending(data)]

  }
}

module.exports = { StreamConsumer }