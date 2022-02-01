

const { window } = require('vscode')
const { RedisModel } = require('../command/redis')
const { Constant, redisOpt } = require('../config')
const { VirtualDoc } = require('../editor')
const { TreeExplorer, TreeDataProvider, } = require('./explorer')
const { ConnectionNode } = require('./node/conection')
const { createLogger } = require('../lib/logging')
const Terminal = require('../terminal')

const log = createLogger('register redis')



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
      let [host, port, password, db = 0] = res.split(':')
      host || (host = '127.0.0.1')
      port || (port = 6379)
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

    this.register('redis-stream.connection.refresh', () => {
      // log('refresh command: ', opt)
      let value = this.cacheGet('redisOpt', "127.0.0.1:6379")
      let [host = '', port = '', password = ''] = value.split(':')
      value = host + ':' + port + ':' + '***'
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
            let [host1 = '', port1 = '', password1 = ''] = text.split(':')
            if (!host1 && !port1 && !password1) return 'host/port/password cant empty only one,至少要有一个参数不为空'
            if (host1 && /[^\w\d-.]/.test(host1.trim())) return host1 + ' 格式不符合，请重输'
            if (port1 && /[^\d]/.test(port1.trim())) return port + ' 格式不符合，请重输'
            return null
          }
        }).then((msg = '') => {
          if (!msg) return
          let [host1 = '', port1 = '', password1 = ''] = msg.split(':')
          if (password1 === '***') {
            msg = host1 + ':' + port1 + ':' + password
          }
          this.cacheSet('redisOpt', msg)
          this.refresh()
        })
    })

    this.register('redis-stream.connection.status', async (opt,) => {
      // log('connection', opt)
      const id = 'redisServerInfo'
      const [item] = await opt.redisModel.redisBase.serverInfo()
      this.doDoc({ id, item })
    })

    const terminal = new Terminal(context)
    this.register('redis-stream.connection.terminal', async (opt,) => {
      log.info('terminal', opt)
      terminal.start(opt)
    })

    this.register('redis-stream.db.status', () => {
      // log('db', opt)

    })

    this.register('redis-stream.db.scan', async (opt,) => {
      // const { label, id, } = opt
      // log('SCAN', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.db.refresh', async (opt,) => {
      const { host, port, db } = opt
      RedisModel.delClient({ host, port, db })
      opt.redisModel = null
      log.info('db refresh', opt)
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
      // const { label, id, } = opt
      // log('ID MORE', opt)
      this.refresh(opt)
    })

    this.register('redis-stream.group.status', async (opt,) => {
      // const { label, id, } = opt
      // log('GROUP', label, id)
      this.doDoc(opt)
    })

    this.register('redis-stream.consumer.status', async (opt,) => {
      // const { label, id, } = opt
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