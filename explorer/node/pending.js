const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { IDTreeItem } = require("./id")

class StreamPending extends TreeDataItem {
  constructor({
    contextValue = NodeType.PENDING,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      label: '', // stream key
      redisDataType: RedisType.string,
      stream: '',
      group: '',
      consumer: '',
      item: null,  // [[]]
      ...opt
    }
  }
  async getChildren() {
    const data = {
      connection: this.config.connection,
      db: this.config.db,
      redisDataType: this.redisDataType,
      contextValue: NodeType.CONSUMER,
      stream: this.config.stream,
      group: this.config.group,
      consumer: this.config.consumer,
      pending: this.label,
    }

    const ids = this.config.item.map(i => {
      data.item = i
      data.label = i[0]
      data.contextValue = NodeType.ID
      let at = i[0].match(/(\d+)-?/)
      at = at ? at[1] : ''
      data.tooltip = new Date(+at).format('yy-MM-dd hh:mm:ss')
      return new IDTreeItem(data)
    })
    return ids
  }
}

module.exports = { StreamPending }