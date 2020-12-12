
const Redis = require("ioredis")
const EventEmitter = require('events')
const debug = require('debug')('pd123:stream')

class RedisQueue {
  constructor(config) {
    this.config = config
    this.stream = config.stream
    this.events = new EventEmitter()
    this.on = this.events.on
    this.initTask(config.taskCb)
  }
  // 添加消息到队列
  async addTask(info) {
    return this.stream.write(info)
  }

  initTask(taskCb) {
    this.events.on('start', (info) => {
      // 有消息进来，开始任务
      // console.log('info:', info)
      taskCb && taskCb(info)
    })
    this.startTask()
  }
  async startTask() {

    while (true) {
      let res = await this.stream.read("$", 1, 0)
      debug('block res:', res)
      this.events.emit('start', res)
    }
  }
  static init(opt) {
    const { name, group, consumer } = opt
    const stream = new RedisStream({ stream: name, group, consumer })
    return new RedisQueue({ stream, ...opt })
  }
}

class RedisStream {
  constructor(config) {
    this.config = {
      stream: 'stream-queue',
      consumer: 's-queue-consumer',
      group: 'g-test',


      ...config
    }
    this.redisRead = config.redisClient || new Redis()
    // this.redisRead = config.redisClientRead
    this.redisWrite = config.redisClientWrite

  }
  /**
   * 消息转移 [{id,item}]
   * @param {string} id 
   * @param {string} consumer 
   * @param {number} idle 最小空闲时间 s （已被读取时长）
   * @param {string} group 
   * @param {string} stream 
   */
  async xclaim(id, consumer, idle = 3600, group = this.config.group, stream = this.config.stream) {
    const query = [stream, group, consumer, idle * 1000]
    if (Array.isArray(id)) query.push(...id)
    else query.push(id)
    debug('xclain query: ', query)
    let res = await this.redisRead.xclaim(query)
    debug(res)
    return res.map(i => this.arr2item(i))
  }
  /**
   * 返回 确认的 数量 0,1...
   * @param {string|array} id 
   * @param {string} group 
   * @param {string} stream 
   */
  xack(id, group = this.config.group, stream = this.config.stream) {
    const query = [stream, group]
    if (Array.isArray(id)) query.push(...id)
    else query.push(id)
    return this.redisRead.xack(query)
  }
  /**
   * 可以同时读多个stream, 返回 [{stream,items:[{item}]}, {}]
   * @param {object} param0 
   * noack: true, 自动 XACK
   * ID '>' 接收从未传递给任何其他使用者的消息: 新消息！
   *    0|time  发送比此ID大的ID消息
   * keys: [stream1,stream2...]
   * ids:  [id1,id2...]
   */
  async readByGroup({ id = '>', consumer = this.config.consumer, group = this.config.group,
    stream = this.config.stream, block, count = 1, noack, keys, ids } = {}) {
    const query = ['GROUP', group, consumer, 'COUNT', +count > 0 ? +count : 1]
    if (block !== undefined && block !== null && block !== '') query.push('BLOCK', block)
    if (noack) query.push('NOACK')
    query.push('STREAMS', stream)
    if (keys) query.push(...keys)
    query.push(id)
    if (ids) query.push(...ids)
    let res = await this.redisRead.xreadgroup(query)

    return res.map(i => {
      let [stream, arr] = i
      return {
        stream,
        items: arr.map(j => this.arr2item(j))
      }
    })
  }
  /**
   * 返回 Pending列表 [], 带start和不带的返回格式不同！
   * @param {object} param0 start,end,count要同时使用
   * {
   *   xPendingLen: 28,
   *   startId: '1606543888690-0',
   *   endId: '1606749928528-0',
   *   consumers: [
   *     { consumer: 's-queue-consumer', xPendingLen: '27' },
   *     { consumer: 'zx', xPendingLen: '1' }
   *   ]
   * }
   * start - end + count 2
   * [
   *  {
   *    id: '1606543888690-0',
   *    consumer: 'zx',
   *    deliveredTime: 71349575,  // 已读取时长
   *    deliveredNum: 1           // 消息被读取次数
   *  },
   *  {
   *    id: '1606544114041-0',
   *    consumer: 's-queue-consumer',
   *    deliveredTime: 34070747,
   *    deliveredNum: 1
   *  }
   *]
   * 
   * 
   * 
   * 
   * 
   */
  async readPending({ start, end, group = this.config.group,
    stream = this.config.stream, count, consumer } = {}) {
    const query = [stream, group]
    if (start && end && count) query.push(start, end, count)
    if (consumer) query.push(consumer)

    let res = await this.redisRead.xpending(query)
    if (start) {
      res = res.map(i => {
        const [id, consumer, deliveredTime, deliveredNum] = i
        return { id, consumer, deliveredTime, deliveredNum }
      })
    } else {
      let [xPendingLen, startId, endId, consumers] = res
      consumers = consumers.map(i => ({ consumer: i[0], xPendingLen: i[1] }))
      res = { xPendingLen, startId, endId, consumers }
    }
    return res
  }
  setLastDeliveredID(id, group = this.config.group, stream = this.config.stream) {
    return this.updateGroup({ type: 'SETID', id, group, stream })
  }
  destoryGroup(group = this.config.group, stream = this.config.stream) {
    return this.updateGroup({ type: 'DESTROY', group, stream })
  }
  delconsumer(consumer, group = this.config.group, stream = this.config.stream) {
    return this.updateGroup({ type: 'DELCONSUMER', group, consumer, stream })
  }
  createConsumer(consumer, group = this.config.group, stream = this.config.stream) {
    return this.updateGroup({ type: 'CREATECONSUMER', group, consumer, stream })
  }
  /**
   * 创建消费者组，功能返回 'OK'
   * 已有则throw err
   * @param {string} group group-name
   * @param {string} id 0, '$'
   * @param {string} stream stream-name
   */
  async createGroup(group, id, stream = this.config.stream) {
    return this.updateGroup({ type: 'CREATE', group, id, stream })
  }
  updateGroup({ id = '$', consumer, type = 'CREATE', group = this.config.group, stream = this.config.stream }) {
    let query = [type, stream, group]
    if (type === 'CREATE' || type === 'SETID') query.push(id)
    consumer && query.push(consumer)
    return this.redisRead.xgroup(query)
  }
  /**
   * 返回流的长度 不存在的流返回 0
   * @param {string} stream channel-name
   */
  getStreamLen(stream = this.config.stream) {
    return this.redisRead.xlen(stream)
  }
  /**
   * 基本stream读消息方法,return null, [{id,item}]
   * @param {number|string} ID 0, $ 最新消息ID(block)
   * @param {number} count null,all 
   * @param {number} block null,不阻塞; 0 一直等
   * @param {string} stream channel-name
   */
  async read(ID = 0, count, block, stream = this.config.stream) {
    let query = ['STREAMS', stream, ID]
    if (count !== undefined && count !== null) query = ['COUNT', count, ...query]
    // .concat(query)
    if (block !== undefined && block !== null) query = ['BLOCK', block].concat(query)
    let res = await this.redisRead.xread(query)
    // let [[, arr]] = res || [[]]
    return res ? res[0][1].map(i => {
      const [id, arr] = i
      const item = {}
      for (let idx = 0; idx < arr.length; idx += 2) {
        item[arr[idx]] = arr[idx + 1]
      }
      return { id, item }
    }) : null
  }
  /**
   * 追加新消息，返回 ID
   * @param {objecg} item key-value obj
   * @param {*|string} ID '*' 自动生成 毫秒时间戳-n
   * @param {string} stream channel-name,如果流不存在，则创建
   */
  async write(item, ID = '*', stream = this.config.stream) {
    if (!item) return null
    const arrItem = []
    Object.keys(item).forEach(i => arrItem.push(i, item[i]))
    let res = await this.redisRead.xadd([stream, ID, ...arrItem])
    return res
  }
  /**
   * 取CONSUMERS状态 [{}]
   * @param {string} group group-name
   * @param {string} stream channel-name
   */
  async getConsumersInfo(group = this.config.group, stream = this.config.stream) {
    let res = await this.getXinfo(['CONSUMERS', stream, group]).catch(err => console.log('err:', err))
    // res = res.map(i => this.arr2obj(i))
    return res ? res.map(i => this.arr2obj(i)) : null
  }
  /**
   * 取groups状态 [{}]
   * @param {string} stream channel-name
   */
  async getGroupsInfo(stream = this.config.stream) {
    let res = await this.getXinfo(['GROUPS', stream])
    res = res.map(i => this.arr2obj(i))
    return res
  }
  /**
   * 取stream状态
   * @param {string} stream channel-name
   */
  async getStreamInfo(stream = this.config.stream, full, count) {
    let query = ['STREAM', stream]
    if (count !== undefined && count !== null) query.push('COUNT', count)
    if (full) query.push('FULL')
    let res = await this.getXinfo(query)
    res = this.arr2obj(res)
    if (full) {
      res['entries'] = res['entries'].map(i => this.arr2item(i))
      res['groups'] = res['groups'].map(i => {
        let g = this.arr2obj(i)
        g.consumers = g.consumers.map(j => this.arr2obj(j))
        // g.pending = g.pending.map(j => this.arr2obj(j))
        return g
      })
    } else {
      res['first-entry'] = this.arr2item(res['first-entry'])
      res['last-entry'] = this.arr2obj(res['last-entry'])
    }

    return res
  }
  async getXinfo(query) {
    let arr = await this.redisRead.xinfo(query)
    return arr
  }
  arr2obj(arr) {
    const info = {}
    for (let idx = 0; idx < arr.length; idx += 2) {
      info[arr[idx]] = arr[idx + 1]
    }
    return info
  }
  arr2item(arr) {
    let [id, item] = arr
    item = this.arr2obj(item)
    return { id, item }
  }
}

class RedisBase {
  constructor(opt = {}) {
    this.config = {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
      // auth: '',
      ...opt
    }
    this.client = opt.client || new Redis(this.config)

  }
  async serverInfo() {
    const res = await this.client.info()
    const { redis_version, connected_clients, blocked_clients, used_memory,
      pubsub_channels, pubsub_patterns } = this.client.serverInfo
    const dbs = {}
    for (let index = 0; index < 16; index++) {
      const db = this.client.serverInfo['db' + index]
      if (db) {
        dbs['db' + index] = db.split(',').reduce((acc, cur) => {
          const [key, value] = cur.split('=')
          acc[key] = +value
          return acc
        }, {})
      }
    }
    return [this.client.serverInfo, dbs, res]
  }
}

module.exports = { RedisStream, RedisQueue, RedisBase }