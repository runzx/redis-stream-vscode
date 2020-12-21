
const { RedisBase, RedisStream } = require('../lib/redis-mq')
const { RedisType, redisOpt } = require('../config')
const IORedis = require('ioredis')


class RedisModel {
  static activeClient = {}

  constructor({ client, db, } = {}) {
    this.db = db
    this.client = client
    this.start({ client, db, })
    this.cursor = 0
    this.scanMore = true
    this.categoryList = {} //{stream:[],zet:[]}
    this.keysLen = 0
    this.searchResult = []
  }
  async scanKeys(cursor = this.cursor, count = 20, scanMore = this.scanMore) {
    if (scanMore === '0') return [this.categoryList, this.keysLen]

    let [cursorNext, keys] = await this.client.scan(cursor, 'count', count)
    const categoryList = this.categoryList
    this.keysLen += keys.length
    for (const key of keys) {
      const type = await this.getType(key)
      if (categoryList[type]) categoryList[type].push(key)
      else categoryList[type] = [key]
    }
    this.cursor = cursorNext
    this.scanMore = cursorNext
    return [categoryList, this.keysLen]
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
  async getKey(key, count = 10) {
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
        content = await stream.getStreamInfo(key, true, count) // full
        break
    }
    return content
  }
  async getStreamInfo(streamKey) {
    const stream = new RedisStream({ client: this.client, stream: streamKey })
    const res = await stream.getStreamInfo(streamKey, true, 10) // full
    if (!res.entries) {
      res.entries = await stream.xrevrange(streamKey, '+', '-', 1)
      if (res.groups === 0) res.groups = []
      else {
        res.groups = await stream.getGroupsInfo(streamKey)
        res.groups = await Promise.all(res.groups.map(async (i) => {
          if (i.consumers === 0) i.consumers = []
          else {
            let res = await stream.getConsumersInfo(i.name)
            res = await Promise.all(res.map(async j => {
              j['pel-count'] = j.pending
              if (j.pending !== 0) {
                j.pending = await stream.readPending({
                  group: i.name, consumer: j.name,
                  start: '-', end: '+', count: 10,
                })
              } else j.pending = []
              return j
            }))
            i.consumers = res
          }
          i['pel-count'] = i.pending
          if (i.pending === 0) i.pending = []
          else {
            let res = await stream.readPending({
              group: i.name,
              start: '-', end: '+', count: 10,
            })
            i.pending = res
          }

          return i
        }))
        // if ()
      }
    } else {
      res.entries = await stream.xrevrange(streamKey, '+', '-', 5)
    }
    return res
  }
  async getInfoById(id, stream) {
    const redis = new RedisStream({ client: this.client, stream })
    const [res] = await redis.xrange(stream, id, '+', 1)
    return res
  }
  async getKeys(pattern = '*') {
    return this.client.keys(pattern)
  }
  async dbInfo() {
    const [serverInfo, dbs, InfoTxt] = await this.redisBase.serverInfo()
    return dbs
  }
  async searchKey(key) {
    if (this.searchResult.find(i => i.key === key)) return
    const type = await this.getType(key)
    this.searchResult.push({ key, type })
    return { key, type }
  }
  start(opt) {
    opt.dbIndex = opt.db = opt.db || opt.dbIndex || 0
    this.redisBase = new RedisBase(opt)
  }
  restart(opt) {
    this.client.disconnect(opt)
    RedisModel.delClient(opt)
    this.client = RedisModel.getClient(opt)
    return this
  }

  static reloadRedis(opt) {
    this.delClient(opt)
    opt.client = this.getClient(opt)
    return new RedisModel(opt)
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
      this.activeClient[key].disconnect()
      this.activeClient[key] = null
      return true
    }
    return null
  }
}


module.exports = {
  RedisModel
}
