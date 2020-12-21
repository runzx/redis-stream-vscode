const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { StreamConsumer } = require("./consumer")
const { StreamPending } = require("./pending")

class StreamGroup extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'GROUP',
      tooltip: 'stream GROUP info',
      arguments: [this],
      command: 'redis-stream.group.status'
    }
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.GORUP
    return new StreamGroup(opt)
  }

  async getChildren() {
    const { db, connection, redisModel,
      redisDataType, stream } = this
    const data = {
      db, connection, redisModel, redisDataType, stream,
      group: this.label,
      collapsibleState: TreeItemCollapsibleState.None
    }
    const { pending, consumers } = this.item
    const c = consumers.map(i => {
      return StreamConsumer.init({
        ...data,
        item: i,
        label: i.name,
        tooltip: `pel-count: ${i['pel-count']}`,
        collapsibleState: i.pending.length > 0
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None
      })
    })

    return [...c, StreamPending.init({
      ...data,
      item: pending,
      label: 'pending',
      tooltip: 'length: ' + this.item['pel-count'],
      collapsibleState: pending.length > 0
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    })]

  }
}

module.exports = { StreamGroup }