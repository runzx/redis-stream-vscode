const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { IDTreeItem } = require("./id")

class StreamPending extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.PENDING
    return new StreamPending(opt)
  }

  async getChildren() {
    const { db, connection, redisModel, redisDataType,
      stream, group, consumer } = this
    const data = {
      db, connection, redisModel,
      redisDataType, stream, group, consumer,
      pending: this.label,
    }
    const ids = this.item.map(i => {
      data.item = i
      data.label = i[0]
      let at = i[0].match(/(\d+)-?/)
      at = at ? at[1] : ''
      data.tooltip = new Date(+at).format('yy-MM-dd hh:mm:ss')
      return IDTreeItem.init(data)
    })
    return ids
  }
}

module.exports = { StreamPending }