const { window, } = require('vscode')
const { Constant, redisOpt } = require('../config')
const { TreeExplorer, TreeDataProvider, } = require('./explorer')
const { ConnectionNode } = require('./node/conection')
const { createLogger } = require('../lib/logging')
const Terminal = require('../terminal')
const { RedisModel } = require('../command/redis')
const { initVdoc, cacheSetVdoc } = require('../editor/v-doc')
const { showModal } = require('../lib/show-message')
const { rmArrItem } = require('../lib/util')

const log = createLogger('register redis')


class RedisTreeDataProvider extends TreeDataProvider {
  redisList = new Map()

  constructor(context) {
    super(context)
  }

  // element->state->Collapsed 第一次点击会触发 getChileren()->getTreeItem()
  // root 时 element 为空
  _getChileren(element) {
    if (element) return element.getChildren()

    return this.getConnections()
  }

  _getTreeItem(element) {
    return element
  }

  getConnections() {
    let list = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY, [])

    return list.map(i => {
      let res = this.redisList.get(i.name)
      if (res) Object.assign(res, i)
      else res = { ...i }
      // res.refresh = this.refresh.bind(this)
      this.redisList.set(i.name, res)
      return res
    }).map(i => ConnectionNode.init(i, this.context))
  }
}

class RedisTree extends TreeExplorer {
  constructor(context) {
    super(context)
    this.docStatus = {}
    this.doc = initVdoc({ context })
    this.init()
  }

  init() {
    const { context } = this
    this.initTree('redisTree', new RedisTreeDataProvider(context))

    this.register('redis-stream.addNewConnect', () => {
      let value = 'local:127.0.0.1:6379:'
      // let value = this.cacheGet('redisOpt', "127.0.0.1:6379")
      window.showInputBox(
        { // 这个对象中所有参数都是可选参数
          password: false,
          ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
          placeHolder: '请输入新连接参数.',
          prompt: 'fmt: "name:host:port:password"   ',
          value,
          validateInput: function (text) {
            // 对输入内容进行验证，返回 null 通过验证
            text = text.trim()
            if (!text) return null
            let [name, host1, port1, password1] = text.split(':')
            host1 = host1.trim()
            port1 = port1.trim()
            // if (!host1 && !port1 && !password1) return 'host/port/password cant empty only one,至少要有一个参数不为空'
            if (host1 && /[^\w\d-.]/.test(host1)) return host1 + ' 格式不符合，请重输'
            if (port1 && /[^\d]/.test(port1)) return port1 + ' 格式不符合，请重输'
            return null
          }
        }).then((msg = '') => {
          let [name = '', host = '127.0.0.1', port = '6379', password] = msg.split(':')
          name = name.trim()
          host = host.trim()
          port = +port.trim()
          password && (password = password.trim())
          name || (name = host)
          let conf = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY)
          if (conf?.length > 0) {
            let item = conf.find(i => i.name === name)
            if (item) Object.assign(item, { host, port, password })
            else conf.push({ host, port, password, name })
          } else conf = [{ host, port, password, name }]
          this.cacheSet(Constant.GLOBALSTATE_CONFIG_KEY, conf)
          this.refresh()
        })
    })

    this.register('redis-stream.connection.refresh', (opt) => {
      // console.log('connection.refresh', opt)
      RedisModel.closeAll(opt.name)
      opt.opt.client?.disconnect()
      opt.opt.client = null
      let conf = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY)
      let item = rmArrItem(conf, 'name', opt.name)
      conf.unshift(item)
      this.cacheSet(Constant.GLOBALSTATE_CONFIG_KEY, conf)
      this.refresh()  // 不带参数，刷新所有 treeView; 把刷新的置顶
    })

    this.register('redis-stream.connection.status', async (opt) => {
      this.doDoc({
        id: `${opt.id}..text.redisServerInfo`,
        item: opt.opt.redisInfo, extension: '.txt'
      })
    })

    const terminal = new Terminal(context)
    this.register('redis-stream.connection.terminal', async (opt,) => {
      const { host, port, password, db, name, id } = opt.opt
      log.info('terminal', opt.opt)
      terminal.start({ host, port, password, db, name, id })
    })

    this.register('redis-stream.connection.trash', async (opt) => {
      // console.log('connection.refresh', opt)
      let action = await showModal('请你确认要删除 redis server?', 'cancel (取消)', 'delete (删除)')
      RedisModel.closeAll(opt.name)
      opt.opt.client?.disconnect()
      opt.opt.client = null

      let conf = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY)
      rmArrItem(conf, 'name', opt.name)
      this.cacheSet(Constant.GLOBALSTATE_CONFIG_KEY, conf)
      this.refresh()
    })

    this.register('redis-stream.db.status', () => {

    })

    this.register('redis-stream.db.scan', async (opt) => {
      this.refresh(opt)
    })

    this.register('redis-stream.db.refresh', async (opt) => {
      log.info('db refresh', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.db.search', async (opt) => {
      window.showInputBox(
        {
          password: false,
          ignoreFocusOut: true,
          placeHolder: '请输入key ...',
          prompt: '"Enter"确认/"ESC"取消   ',
          // value,
        }).then(async (msg) => {
          if (!msg) return
          await opt.redisModel.searchKey(msg)
          // 有searchItem 时不再刷新整个 db Item
          this.refresh(opt.opt.searchItem || opt)
        })
    })

    this.register('redis-stream.stream.showMore', async (opt) => {
      this.refresh(opt)
    })

    this.register('redis-stream.group.status', async (opt) => {
      this.doDoc(opt)
    })

    this.register('redis-stream.consumer.status', async (opt) => {
      this.doDoc(opt)
    })

    this.register('redis-stream.key.status', async (opt) => {
      if (opt.redisDataType === 'stream') return this.doc.showDoc(opt.id)
      this.openResource(opt)
    })
  }

  doDoc({ id, item, extension }) {
    cacheSetVdoc(id, item)
    this.doc.showDoc(id, extension)

    if (this.docStatus[id]) {
      this.doc.update(id)
    }
    this.docStatus[id] = true
  }

}


module.exports = {
  RedisTree,
}