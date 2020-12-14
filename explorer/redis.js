

const { TreeItemCollapsibleState, window } = require('vscode')
const { redisModel } = require('../command/redis')
const { Constant, redisOpt } = require('../config')
const { VirtualDoc } = require('../editor')
const { log } = require('../lib/logging')
const { TreeExplorer, TreeDataProvider, TreeDataItem } = require('./explorer')
const { ConnectionNode } = require('./node/conection')

class RedisTreeItem extends TreeDataItem {
  constructor({ label, id, iconPath, command,
    resourceUri, tooltip, collapsibleState, contextValue }) {
    super({
      label, id, iconPath, command, resourceUri,
      tooltip, collapsibleState, contextValue
    })

  }
}

class RedisTreeDataProvider extends TreeDataProvider {
  constructor(context) {
    super(context)
    // this.context = context
    // Expanded 时会在其item 上 getChileren()
    // this.treeData = [new ConnectionNode({ collapsibleState: TreeItemCollapsibleState.Expanded })]
  }

  // element->state->Collapsed 第一次点击会触发 getChileren()->getTreeItem()
  _getChileren(element) {
    if (element) return element.getChildren()

    const config = this.getConnections()
    return ConnectionNode.init({ ...config })
  }
  _getTreeItem(element) {
    return element
  }

  getConnections() {
    let res = this.cacheGet(Constant.GLOBALSTATE_CONFIG_KEY, redisOpt)
    if (typeof res === 'string') {
      const [host, port, password] = res.split(':')
      return { host, port, password }
    }
    return res
  }
}

class RedisTree extends TreeExplorer {
  constructor(context) {
    super(context)
    this.init()
  }
  init() {
    this.initTree('redisTree', new RedisTreeDataProvider(this.context))
    this.register('redis-stream.connection.status', async (opt, opt1, opt2) => {
      log('connection', opt)
      const [serInfo] = await redisModel.redisBase.serverInfo()
      let doc = VirtualDoc.init('redis-stream', this.context, serInfo)
      doc.showDoc('redisServerInfo.json')
    })
    this.register('redis-stream.db.status', (opt, opt1, opt2) => {
      // log('db', opt)

    })

    this.register('redis-stream.key.status', async (opt) => {
      const { label, id } = opt
      log('KEY', label, id)
      let doc = VirtualDoc.init('redis-stream', this.context)
      doc.showDoc(id + '.json')
    })

    this.register('redis-stream.id.status', async (opt,) => {
      const { label, id } = opt
      log('ID', label, id)
      let doc = VirtualDoc.init('redis-stream', this.context, opt.item)
      doc.showDoc(id + '.json')
    })

    this.register('redis-stream.group.status', async (opt,) => {
      const { label, id } = opt
      log('GROUP', label, id)
      let doc = VirtualDoc.init('redis-stream', this.context, opt.item)
      doc.showDoc(id + '.json')
    })

    this.register('redis-stream.consumer.status', async (opt,) => {
      const { label, id } = opt
      log('CONSUMER', label, id)
      let doc = VirtualDoc.init('redis-stream', this.context, opt.item)
      doc.showDoc(id + '.json')
    })

    this.register('redis-stream.connection.refresh', (opt) => {
      log('refresh command: ', opt)
      const value = this.cacheGet('redisOpt', "127.0.0.1:6379")
      window.showInputBox(
        { // 这个对象中所有参数都是可选参数
          password: false, // 输入内容是否是密码
          ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
          placeHolder: '如要改变请输入新参数.', // 在输入框内的提示信息
          prompt: '格式 "127.0.0.1:6379:password" Enter确认/ESC中止', // 在输入框下方的提示信息
          value,
          validateInput: function (text) {
            // 对输入内容进行验证，返回 null 通过验证
            if (!text || !text.trim()) return null
            text = text.trim()
            const [host = '', port = '', password] = text
            if (/[^\w\d]/.test(host.trim())) return text
            if (/[^\w\d]/.test(port.trim())) return text

            if (host && port) return null
            return text
          }
        }).then((msg = '') => {
          log('Refresh new init', msg)
          if (!msg) return
          this.cacheSet('redisOpt', msg)
          this.refresh(msg, opt)
        })
    })
  }
}


module.exports = {
  RedisTree,
  RedisTreeItem,
}