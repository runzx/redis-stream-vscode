const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { redisModel } = require("../../command/redis")

class IDTreeItem extends TreeDataItem {
  constructor({
    contextValue = NodeType.ID,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      type: '',
      redisDataType: RedisType.string,
      item: null,  // {key:value} 
      ...opt
    }
    this.init()

    this.command = {
      title: 'ID',
      tooltip: 'stream ID info',
      arguments: [this],
      command: 'redis-stream.id.status'
    }
  }
  init() {
    const { connection, db, redisDataType, label, group, stream, consumer } = this.config
    this.id = `${connection}_${db}_${redisDataType}_${stream}_${group}_${consumer}_${label}.json`
  }
  async getChildren() { }
}

module.exports = { IDTreeItem }