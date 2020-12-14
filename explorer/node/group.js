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
    const data = {
      connection: this.connection,
      db: this.db,
      redisDataType: this.redisDataType,
      stream: this.stream,
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
        collapsibleState: i.pending.length > 0 ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None
      })
    })

    return [...c, StreamPending.init({
      ...data,
      item: pending,
      label: 'pending',
      tooltip: 'pending length: ' + pending.length,
    })]

  }
}

module.exports = { StreamGroup }