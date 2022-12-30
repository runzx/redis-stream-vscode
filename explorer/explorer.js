
const path = require('path')
const vscode = require("vscode")
const { NodeType, RedisType } = require("../config")
const { isEmpty, } = require('../lib/util')
const { createLogger } = require('../lib/logging')

const log = createLogger('explorer')
const { TreeItemCollapsibleState, EventEmitter, TreeItem, } = vscode
const { registerCommand, } = vscode.commands

class TreeExplorer {
  constructor(context,) {
    this.context = context
    this.subscriptions = context.subscriptions
    this.provider = null
  }

  refresh(data) {
    log.info('TreeExplorer refresh',)

    this.provider.refresh(data)
  }

  initTree(viewId, treeDataProvider) {
    this.provider = treeDataProvider
    this.subscriptions.push(
      vscode.window.createTreeView(viewId, { treeDataProvider }))
  }

  register(command, cb) {
    cb && this.subscriptions.push(registerCommand(command, cb))
  }
  cacheGet(key, defaultValue) {
    return this.context.globalState.get(key, defaultValue)
  }
  cacheSet(key, value) {
    return this.context.globalState.update(key, value)
  }
}

class TreeDataProvider {
  constructor(context) {
    this.context = context
    this._onDidChangeTreeData = new EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event
  }
  async getChildren(element) {
    log.info('getChildren', element ? element.label : '')
    if (element) return element.getChildren()

    return this._getChileren()
  }
  // refresh getTreeItem -> getChildren 
  async getTreeItem(element) {
    log.info('getTreeItem', element.label)

    element.refresh = (e, cb) => {

      cb && (e.refreshCallBack = cb)
      this.refresh(e)
    }
    if (this._getTreeItem) return this._getTreeItem(element)

    return element
  }

  refresh(item) {
    log.info('TreeDataProvider refresh',)
    this._onDidChangeTreeData.fire(item)
  }
  cacheGet(key, defaultValue) {
    return this.context.globalState.get(key, defaultValue)
  }
  cacheSet(key, value) {
    return this.context.globalState.update(key, value)
  }
  cacheList() {
    return this.context.globalState.keys().map(key => [key, this.cacheGet(key)])
  }
  register(command, cb) {
    cb && this.context.subscriptions.push(registerCommand(command, cb))
  }
}

class TreeDataItem extends TreeItem {
  constructor(opt = {}) {
    super(opt.label || opt.resourceUri, opt.collapsibleState)

    this.opt = opt
    this.name = opt.name
    this.resourceUri = opt.resourceUri
    this.iconPath = opt.iconPath
    this.description = opt.description
    this.tooltip = opt.tooltip  // 鼠标悬浮时显示内容
    this.command = opt.command  // 点击树节点时，执行此命令
    this.contextValue = opt.contextValue
    this.redisDataType = opt.redisDataType
    this.iconPath = path.join(__dirname, '..', 'image', `${this.contextValue}.png`)

    this.type = opt.type
    // 可折叠状态
    this.collapsibleState = opt.collapsibleState || this.getCollapseState(this)
    this.connection = opt.connection
    this.db = opt.db
    this.item = opt.item
    this.stream = opt.stream
    this.group = opt.group
    this.consumer = opt.consumer
    this.pending = opt.pending
    this.id = opt.id || this.getId(opt)
    // console.log(this.id)
    // this.context = opt.context
    this.redisModel = opt.redisModel
  }

  getId(opt = {}) {
    const res = ['connection', 'db', 'redisDataType', 'stream', 'group', 'consumer', 'pending', 'label']
      .filter(i => {
        if (isEmpty(opt[i])
          || (i === 'label' && this.contextValue === NodeType.REDISDATATYPE))
          return null
        return true
      })
      .map(j => opt[j])
      .join('$')
    return res
  }
  getCollapseState(element) {
    if (element.contextValue === NodeType.KEY
      && element.redisDataType === RedisType.stream)
      return TreeItemCollapsibleState.Collapsed

    if (element.type === RedisType.stream
      && element.redisDataType === RedisType.searchKey)
      return TreeItemCollapsibleState.Collapsed

    if (element.contextValue === NodeType.KEY
      || element.contextValue === NodeType.ID
      || element.contextValue === NodeType.SCANMORE
      || element.contextValue === NodeType.INFO)
      return TreeItemCollapsibleState.None
  }
  setCollapseState() { }
  dateFmt(at = new Date(), fmt = 'MM-dd hh:mm:ss') {
    return new Date(+at).format(fmt)
  }
  id2date(id = '', fmt) {
    if (typeof id === 'number') return this.dateFmt(id, fmt)
    const [, at = ''] = id.match(/(\d+)-?/) || []
    return this.dateFmt(at, fmt)
  }
}

module.exports = { TreeExplorer, TreeDataProvider, TreeDataItem }