const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { StreamConsumer } = require("./consumer")
const { StreamPending } = require("./pending")

class StreamGroup extends TreeDataItem {
  constructor({
    contextValue = NodeType.GORUP,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      label: '', // stream key
      redisDataType: RedisType.string,
      stream: '',
      item: null,  // {name,consumers,pending...}
      ...opt
    }
    this.init()
    this.command = {
      title: 'GROUP',
      tooltip: 'stream GROUP info',
      arguments: [this],
      command: 'redis-stream.group.status'
    }
  }
  init() {
    const { connection, db, redisDataType, label, stream, } = this.config
    this.id = `${connection}_${db}_${redisDataType}_${stream}_${label}.json`
  }
  async getChildren() {

    const data = {
      connection: this.config.connection,
      db: this.config.db,
      redisDataType: this.redisDataType,
      contextValue: NodeType.CONSUMER,
      stream: this.config.stream,
      group: this.label,
      collapsibleState: TreeItemCollapsibleState.Collapsed
    }

    const { pending, consumers } = this.config.item
    const c = consumers.map(i => {
      // const {name:label,}=i
      data.item = i
      data.label = i.name
      data.tooltip = `pel-count: ${i['pel-count']}`
      if (i.pending.length > 0) data.collapsibleState = TreeItemCollapsibleState.Collapsed
      else data.collapsibleState = TreeItemCollapsibleState.None
      return new StreamConsumer(data)
    })
    data.item = pending
    data.label = 'pending'
    data.contextValue = NodeType.PENDING
    data.tooltip = 'pending length: ' + pending.length
    return [...c, new StreamPending(data)]

  }
}

module.exports = { StreamGroup }