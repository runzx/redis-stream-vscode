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
      if (Array.isArray(i)) {
        data.item = i
        data.label = i[0]
        data.tooltip = this.id2date(data.label)
        if (i.length === 3) {
          data.tooltip += ` | ${this.id2date(i[1])} | ${i[2]}`
        } else
          data.tooltip += ` | ${i[1]} | ${this.id2date(i[2])} | ${i[3]}`
      } else {
        data.label = i.id
        data.tooltip = `${this.id2date(data.label)} | ${i.consumer} | ${i.deliveredTime} | ${i.deliveredNum}`
      }

      return IDTreeItem.init(data)
    })
    return ids
  }
}

module.exports = { StreamPending }