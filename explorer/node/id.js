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
    const { connection, db, redisDataType, label, group, stream, consumer } = opt
    opt.id = `${connection}_${db}_${redisDataType}_${stream}_${group}_${consumer}_${label}.json`
    return new IDTreeItem(opt)
  }
  async getChildren() { }
}

module.exports = { IDTreeItem }