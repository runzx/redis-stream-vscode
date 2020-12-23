

const { TreeItemCollapsibleState, window } = require('vscode')
const { redisModel, RedisModel } = require('../command/redis')
const { Constant, redisOpt } = require('../config')
const { VirtualDoc } = require('../editor')
const { log } = require('../lib/logging')
const { TreeExplorer, TreeDataProvider, TreeDataItem } = require('./explorer')
const { ConnectionNode } = require('./node/conection')


class RedisTreeDataProvider extends TreeDataProvider {
  constructor(context) {
    super(context)
  }
  // element->state->Collapsed 第一次点击会触发 getChileren()->getTreeItem()
  // root 时 element 为空
  _getChileren(element) {
    if (element) return element.getChildren()

    const config = this.getConnections()
    return [ConnectionNode.init({ ...config, context: this.context })]
  }
  _getTreeItem(element) {
    if (element.getTreeItem) return element.getTreeItem(this)
    return element
  }

  getConnections() {
    let res = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY, redisOpt)
    if (typeof res === 'string') {
      let [host, port = 6379, password, db = 0] = res.split(':')
      host = host ? host : '127.0.0.1'
      port = port ? port : 6379
      return { host, port, password, db }
    }
    return res
  }
}

class RedisTree extends TreeExplorer {
  constructor(context) {
    super(context)
    this.docStatus = {}
    this.doc = VirtualDoc.init({ context })
    this.init()
  }
  init() {
    const { context } = this
    this.initTree('redisTree', new RedisTreeDataProvider(context))

    this.register('redis-stream.connection.refresh', (opt) => {
      // log('refresh command: ', opt)
      const value = this.cacheGet('redisOpt', "127.0.0.1:6379")
      window.showInputBox(
        { // 这个对象中所有参数都是可选参数
          password: false,
          ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
          placeHolder: '如要改变请输入新参数.',
          prompt: 'fmt: "127.0.0.1:6379:password"   ',
          value,
          validateInput: function (text) {
            // 对输入内容进行验证，返回 null 通过验证
            if (!text || !text.trim()) return null
            text = text.trim()
            const [host = '', port = '', password] = text.split(':')
            if (!host && !port && !password) return 'host/port/password cant empty only one,至少要有一个参数不为空'
            if (host && /[^\w\d-]/.test(host.trim())) return host + ' 格式不符合，请重输'
            if (port && /[^\d]/.test(port.trim())) return port + ' 格式不符合，请重输'
            return null
          }
        }).then((msg = '') => {
          if (!msg) return
          this.cacheSet('redisOpt', msg)
          this.refresh()
        })
    })

    this.register('redis-stream.connection.status', async (opt,) => {
      // log('connection', opt)
      const id = 'redisServerInfo'
      const [item] = await RedisModel.init(opt).redisBase.serverInfo()
      this.doDoc({ id, item })
    })

    this.register('redis-stream.db.status', (opt,) => {
      // log('db', opt)

    })

    this.register('redis-stream.db.scan', async (opt,) => {
      const { label, id, } = opt
      // log('SCAN', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.db.refresh', async (opt,) => {
      const { host, port, db } = opt
      RedisModel.delClient({ host, port, db })
      opt.redisModel = null
      // log('DB REFRESH', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.db.search', async (opt,) => {
      let { redisModel } = opt
      if (!redisModel) {
        const { host, port, db, password } = opt
        opt.redisModel = redisModel = RedisModel.init({ host, port, db, password })
      }
      window.showInputBox(
        {
          password: false,
          ignoreFocusOut: true,
          placeHolder: '请输入key ...',
          prompt: '"Enter"确认/"ESC"取消   ',
          // value,
        }).then(async (msg) => {
          // log('SEARCH:', msg)
          if (!msg) return
          await redisModel.searchKey(msg)
          this.refresh(opt)
        })
    })

    this.register('redis-stream.stream.showMore', async (opt,) => {
      const { label, id, } = opt
      // log('ID MORE', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.group.status', async (opt,) => {
      const { label, id, } = opt
      // log('GROUP', label, id)
      this.doDoc(opt)
    })

    this.register('redis-stream.consumer.status', async (opt,) => {
      const { label, id, } = opt
      // log('CONSUMER', label, id)
      this.doDoc(opt)
    })

  }

  doDoc({ id, item }) {
    VirtualDoc.setCacheDoc(id, item)
    this.doc.showDoc(id)

    if (this.docStatus[id]) {
      this.doc.update(id)
    }
    this.docStatus[id] = true
  }
}


module.exports = {
  RedisTree,
}