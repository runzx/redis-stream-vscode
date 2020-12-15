
const { RedisBase, RedisStream } = require('../lib/redis-mq')
const { RedisType, redisOpt } = require('../config')
const IORedis = require('ioredis')


class RedisModel {
  static activeClient = {}

  constructor({ client, db, } = {}) {
    this.db = db
    this.client = client
    this.start({ client, db, })
  }
  async getKeysByAllCategory() {
    let [cursor, keys] = await this.client.scan(0,)
    console.log('cursor:', cursor, keys)
    const categoryArr = {}
    for (const key of keys) {
      const type = await this.getType(key)
      if (categoryArr[type]) categoryArr[type].push(key)
      else categoryArr[type] = [key]
    }
    return categoryArr
  }
  async getType(key) {
    return this.client.type(key)
  }
  async select(dbIndex) {
    if (dbIndex !== this.config.dbIndex) {
      await this.client.select(dbIndex)
      this.config.dbIndex = dbIndex
    }

  }
  async getKey(key) {
    const type = await this.getType(key)
    let content    //  = await this.client.get(key)
    switch (type) {
      case RedisType.string:
        content = await this.client.get(key)
        break
      case RedisType.hash:
        const hall = await this.client.hgetall(key)
        content = Object.keys(hall).map(key => {
          return { key, value: hall[key] }
        })
        break
      case RedisType.list:
        content = await this.client.lrange
          (key, 0, await this.client.llen(key))
        break
      case RedisType.set:
        content = await this.client.smembers(key)
        break
      case RedisType.zset:
        content = await this.client.zrange
          (key, 0, await this.client.zcard(key))
        break
      case RedisType.stream:
        const stream = new RedisStream({ client: this.client, stream: key })
        content = await stream.getStreamInfo(undefined, true, 20)

        break
    }
    return content
  }
  async getKeys(pattern = '*') {
    return this.client.keys(pattern)
  }
  async info() {
    const [serverInfo, dbs, InfoTxt] = await this.redisBase.serverInfo()
    return dbs
  }

  start(opt) {
    opt.dbIndex = opt.db = opt.db || opt.dbIndex || 0
    this.redisBase = new RedisBase(opt)
    // this.client = this.redisBase.client
    // this.config.dbIndex = opt.db
    // this.client.select(this.config.dbIndex)
  }
  restart(opt) {
    this.client.disconnect(opt)
    RedisModel.delClient(opt)
    this.client = RedisModel.getClient(opt)
    return this
  }

  static init(opt) {
    opt.db = opt.db || opt.dbIndex
    if (!opt.client) opt.client = this.getClient(opt)
    return new RedisModel(opt)
  }
  static getClient({ host = '127.0.0.1', port = 6379, password, db = 0, connection }) {
    if (connection) {
      let [h, p, d] = connection.split(':')
      h && (host = h)
      p && (port = p)
    }
    const key = `${host}-${port}-${db}`
    if (this.activeClient[key]) return this.activeClient[key]
    this.activeClient[key] = new IORedis({ host, port, password, db })
    return this.activeClient[key]
  }
  static delClient({ host, port, password, db = 0 }) {
    const key = `${host}-${port}-${db}`
    if (this.activeClient[key]) {
      this.activeClient[key] = null
      return true
    }
    return null
  }
}


module.exports = {
  RedisModel
}
