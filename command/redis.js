
const { RedisBase, RedisStream } = require('../lib/redis-mq')
const { RedisType, redisOpt, SHOW_MORE_COUNT } = require('../config')
const IORedis = require('ioredis')
const { log } = require('../lib/logging')


class RedisModel {
  static activeClient = {}
  redisBase
  constructor({ client, db = 0, ...opt } = {}) {
    this.db = db
    this.client = client
    this.redisBase = new RedisBase({ client, db })
    this.cursor = 0
    this.scanMore = true
    this.categoryList = {} //{stream:[],zet:[]}
    this.keysLen = 0
    this.searchResult = []
    this.streamIDs = {} // show more start
    this.watch(opt)
  }
  watch(opt) {
    this.client.on('error', err => {
      log('Connect err:', err, opt)
    })
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
    if (!this.streamIDs[streamKey]) this.streamIDs[streamKey] = SHOW_MORE_COUNT
    if (!res.entries) {
      res.entries = await stream.xrevrange(streamKey, '+', '-', this.streamIDs[streamKey])
      if (res.groups === 0) res.groups = []
      else {
        res.groups = await this.getGroupInfo(streamKey, stream)
      }
    } else {
      res.entries = await stream.xrevrange(streamKey, '+', '-', this.streamIDs[streamKey])
    }
    this.streamIDs[streamKey] += SHOW_MORE_COUNT
    return res
  }
  async getGroupInfo(streamKey, redisStream) {
    if (!redisStream) redisStream = new RedisStream({ client: this.client, stream: streamKey })
    const res = await redisStream.getGroupsInfo(streamKey)
    return Promise.all(res.map(async (i) => {
      if (i.consumers === 0) i.consumers = []
      else {
        i.consumers = await this.getConsumersInfo(i.name, streamKey, redisStream)
      }
      i['pel-count'] = i.pending
      if (i.pending === 0) i.pending = []
      else {
        let res = await redisStream.readPending({
          group: i.name,
          start: '-', end: '+', count: 10,
        })
        i.pending = res
      }

      return i
    }))
  }
  async getConsumersInfo(group, streamKey, redisStream) {
    if (!redisStream) redisStream = new RedisStream({ client: this.client, stream: streamKey })
    const res = await redisStream.getConsumersInfo(group, streamKey)
    return Promise.all(res.map(async j => {
      j['pel-count'] = j.pending
      if (j.pending !== 0) {
        j.pending = await redisStream.readPending({
          group, consumer: j.name,
          start: '-', end: '+', count: 10,
        })
      } else j.pending = []
      return j
    }))
  }
  async getInfoById(id, stream) {
    const redis = new RedisStream({ client: this.client, stream })
    const [res] = await redis.xrange(stream, id, '+', 1)
    return res
  }
  async getKeys(pattern = '*') {
    return this.client.keys(pattern)
  }
  dbInfo() {
    return new Promise((resolve, reject) => {
      this.client.on('error', err => {
        console.log('redis connection err:', err)
        reject(err.message)
      })

      this.redisBase.serverInfo().then(res => {
        const [serverInfo, dbs, InfoTxt] = res
        resolve(dbs)
      })
    })

  }
  async searchKey(key) {
    if (this.searchResult.find(i => i.key === key)) return
    const type = await this.getType(key)
    this.searchResult.push({ key, type })
    return { key, type }
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
  static getClient({ host = '127.0.0.1', port = 6379, password, db = 0 }) {
    const key = this.getKey({ host, port, db })
    if (this.activeClient[key]) return this.activeClient[key]
    this.activeClient[key] = new IORedis({ host, port, password, db })
    this.activeClient[key].client('id').then(id => {
      log('Connect ID:', id, key)
    })
    this.activeClient[key].client('list').then(msg => {
      let res = msg.split('\n')
        .filter(i => i)
        .map(i => i.split(' ')
          .reduce((acc, j) => {
            let [key, value] = j.split('=')
            acc[key] = value
            return acc
          }, {}))
        .sort((a, b) => (a.id - b.id))
        .map(k => {
          const { age, cmd, db, id, idle, psub, sub } = k
          const arr = ['id', 'age', 'idle', 'psub', 'sub', 'cmd']
          return arr.reduce((acc, i) => {
            acc += [i, k[i]].join(':') + ' '
            return acc
          }, '')
          // return { id, age, idle, psub, sub, cmd }
        })


      log('Connect LIST:', key, res)
    })
    return this.activeClient[key]
  }
  static delClient({ host, port, db = 0 }) {
    const key = this.getKey({ host, port, db })
    if (this.activeClient[key]) {
      this.activeClient[key].disconnect()
      // .then(res => log('DELclient', key, res))
      this.activeClient[key] = null
      return true
    }
    return null
  }
  static getKey({ host = '127.0.0.1', port = 6379, db = 0, }) {
    return `${host}-${port}-${db}`
  }
}


module.exports = {
  RedisModel
}
