
const { RedisBase, RedisStream } = require('../lib/redis-mq')
const { RedisType } = require('../config')

class RedisModel {
  constructor(opt) {
    this.config = {
      dbIndex: 0,
      ...opt
    }
    this.redisBase = new RedisBase()
    this.redisClient = this.redisBase.client
  }
  async getKey(key) {
    const type = await this.redisClient.type(key)
    let content    //  = await this.redisClient.get(key)
    switch (type) {
      case RedisType.string:
        content = await this.redisClient.get(key)
        break
      case RedisType.hash:
        const hall = await this.redisClient.hgetall(key)
        content = Object.keys(hall).map(key => {
          return { key, value: hall[key] }
        })
        break
      case RedisType.list:
        content = await this.redisClient.lrange
          (key, 0, await this.redisClient.llen(key))
        break
      case RedisType.set:
        content = await this.redisClient.smembers(key)
        break
      case RedisType.zset:
        content = await this.redisClient.zrange
          (key, 0, await this.redisClient.zcard(key))
        break
      case RedisType.stream:
        const stream = new RedisStream({ redisClient: this.redisClient, stream: key })
        content = await stream.getStreamInfo(undefined, true, 1)

        break
    }
    return content
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