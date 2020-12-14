
const { RedisBase, RedisStream } = require('../lib/redis-mq')
const { RedisType, redisOpt } = require('../config')

class RedisModel {
  constructor(opt) {
    this.config = {
      dbIndex: 0,
      ...opt
    }
    this.start(opt)
  }
  async getKeysByAllCategory(dbIndex = this.config.dbIndex) {
    await this.select(dbIndex)

    let [cursor, keys] = await this.redisClient.scan(0,)
    console.log('cursor:', cursor)
    const categoryArr = {}
    for (const key of keys) {
      const type = await this.getType(key)
      if (categoryArr[type]) categoryArr[type].push(key)
      else categoryArr[type] = [key]
    }
    return categoryArr
  }
  async getType(key, dbIndex = this.config.dbIndex) {
    await this.select(dbIndex)
    return this.redisClient.type(key)
  }
  async select(dbIndex) {
    if (dbIndex !== this.config.dbIndex) {
      await this.redisClient.select(dbIndex)
      this.config.dbIndex = dbIndex
    }
  }
  async getKey(key, dbIndex = this.config.dbIndex) {
    await this.select(dbIndex)
    const type = await this.getType(key)
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
        content = await stream.getStreamInfo(undefined, true, 20)

        break
    }
    return content
  }
  async getKeys(pattern = '*', dbIndex = this.config.dbIndex) {
    await this.select(dbIndex)

    return this.redisClient.keys(pattern)
  }
  async info() {
    const [serverInfo, dbs, InfoTxt] = await this.redisBase.serverInfo()
    return dbs
  }
  static init(opt) {
    opt.db = opt.db || opt.dbIndex
    return new RedisModel(opt)
  }
  start(opt) {
    opt.db = opt.db || opt.dbIndex
    this.redisBase = new RedisBase(opt)
    this.redisClient = this.redisBase.client
  }
}

let redis = RedisModel.init(redisOpt)

module.exports = {
  redisModel: redis
}
