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

  static init({ id, ...opt }) {
    opt.id = `${id.replace('.s-group.', '.s-consumer.')}.${opt.label}`
    opt.contextValue = NodeType.CONSUMER
    return new StreamConsumer(opt)
  }

  async getChildren() {
    const data = {
      ...this.opt,
      item: this.item.pending,
      consumer: this.label,
      label: 'pending',
      tooltip: 'length: ' + this.item.pending.length,
      collapsibleState: TreeItemCollapsibleState.Collapsed
    }
    return [StreamPending.init(data)]
  }

  async getTreeItem(parent) {
    let { refreshCallBack, stream, group } = this
    const [item] = (await this.redisModel.getConsumersInfo(group, stream)).filter(i => i.name === this.label)
    this.item = item
    this.tooltip = `pel-count: ${item['pel-count']}`,
      refreshCallBack && refreshCallBack(item)
    return this
  }
}

module.exports = { StreamConsumer }