const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { StreamPending } = require("./pending")

class StreamConsumer extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'CONSUMER',
      tooltip: 'stream CONSUMER info',
      arguments: [this],
      command: 'redis-stream.consumer.status'
    }
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.CONSUMER
    return new StreamConsumer(opt)
  }
  async getChildren() {
    const { db, connection, redisModel, redisDataType,
      stream, group } = this
    const data = {
      db, connection, redisModel,
      redisDataType, stream, group,

      consumer: this.label,
      collapsibleState: TreeItemCollapsibleState.Collapsed
    }

    const { pending } = this.item
    data.item = pending
    data.label = 'pending'

    data.tooltip = 'length: ' + pending.length
    return [StreamPending.init(data)]

  }

  async getTreeItem(parent) {
    let { host, port, password, db, refreshCallBack, stream, group } = this
    if (!this.redisModel) {
      this.redisModel = RedisModel.init({ host, port, password, db })
    }
    const [item] = (await this.redisModel.getConsumersInfo(group, stream)).filter(i => i.name === this.label)
    this.item = item
    this.tooltip = `pel-count: ${item['pel-count']}`,
      refreshCallBack && refreshCallBack(item)
    return this
  }
}

module.exports = { StreamConsumer }