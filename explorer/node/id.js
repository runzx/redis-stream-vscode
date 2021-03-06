const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { redisModel } = require("../../command/redis")

class IDTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'ID',
      tooltip: 'stream ID info',
      arguments: [this],
      command: 'redis-stream.id.status'
    }
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.ID
    return new IDTreeItem(opt)
  }
  async getChildren() { }
}

module.exports = { IDTreeItem }