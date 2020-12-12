
const { RedisBase } = require('../lib/redis-mq')

class RedisModel {
  constructor(opt) {
    this.config = {
      dbIndex: 0,
      ...opt
    }
    this.redisBase = new RedisBase()
    this.redisClient = this.redisBase.client
  }
  async getKeys(pattern = '*', dbIndex = this.config.dbIndex) {
    if (dbIndex !== this.config.dbIndex) {
      await this.redisClient.select(dbIndex)
      this.dbIndex = dbIndex
    }
    return this.redisClient.keys(pattern)
  }
  async info() {
    const [serverInfo, dbs, InfoTxt] = await this.redisBase.serverInfo()
    return dbs
  }
  static init(opt) {
    return new RedisModel(opt)
  }
}

module.exports = {

  redisModel: RedisModel.init()
}