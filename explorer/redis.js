

const { TreeItemCollapsibleState } = require('vscode')
const { redisModel } = require('../command/redis')
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
  // getChileren(element) { }

}

class RedisTreeDataProvider extends TreeDataProvider {
  constructor() {
    super()
    // Expanded 时会在其item 上 getChileren()
    this.treeData = [new ConnectionNode({ label: 'rootZx', collapsibleState: TreeItemCollapsibleState.Expanded })]

  }

  // element->state->Collapsed 第一次点击会触发 getChileren()->getTreeItem()
  _getChileren(element) {
    if (!element) {
      const config = this.getConnections()
      return Object.keys(config).map(key => {
        return new ConnectionNode(key, config[key])
      })
    } else {
      return element.getChildren()
    }
  }
  _getTreeItem(element) {
    return element
    const { label, tooltip } = element
    return {
      label,
      tooltip: 'my ' + tooltip + ' item'
    }
  }
}

class RedisTree extends TreeExplorer {
  constructor(context) {
    super(context)
    this.init()
  }
  init() {
    this.initTree('redisTree', new RedisTreeDataProvider())
    this.register('redis-stream.connection.status', (opt, opt1, opt2) => {
      console.log(opt, opt1, opt2)
      // log('connection', res)
      // showMsg('显示?' + res.label)
    })
    this.register('redis-stream.db.status', (opt, opt1, opt2) => {
      console.log('db.status: ', opt, opt1, opt2)

      // log('connection', res)
      // showMsg('显示?' + res.label)
    })
    this.register('redis-stream.key.status', async (opt, opt1, opt2) => {
      console.log('key.status: ', opt, opt1, opt2)
      const { label, id } = opt
      let doc = VirtualDoc.init('redis-stream', this.context)
      let res = doc.showDoc(id)
      // let res = await redisModel.getKey(label)
      log('KEY', label, id)
      // showMsg('显示?' + res.label)
    })
    this.register('redis-stream.id.status', async (opt,) => {
      console.log('ID.status: ', opt,)
      const { label, id } = opt
      let doc = VirtualDoc.init('redis-stream', this.context, opt.config.item)
      let res = doc.showDoc(id)
      // let res = await redisModel.getKey(label)
      log('KEY', label, id)
      // showMsg('显示?' + res.label)
    })
  }
}


module.exports = {
  RedisTree,
  RedisTreeItem,
}