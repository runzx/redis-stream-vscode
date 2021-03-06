
const path = require('path')
const vscode = require("vscode")
const { NodeType, RedisType } = require("../config")
const { log } = require('../lib/logging')
const { isEmpty, dateYMD } = require('../lib/util')
const { TreeItemCollapsibleState, EventEmitter, TreeItem, Uri } = vscode
const { registerCommand, registerTextEditorCommand } = vscode.commands

class TreeExplorer {
  constructor(context, openExplorerCommand) {
    this.context = context
    this.subscriptions = context.subscriptions
    this.provider = null
  }

  refresh(data) {
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
    if (element) return element.getChildren()

    return this._getChileren(element)
  }
  // refresh getTreeItem -> getChildren 
  async getTreeItem(element) {
    element.refresh = (e, cb) => {
      cb && (e.refreshCallBack = cb)
      this.refresh(e)
    }
    if (this._getTreeItem) return this._getTreeItem(element)

    return element
  }

  refresh(item) {
    this._onDidChangeTreeData.fire(item)
  }
  cacheGet(key, defaultValue) {
    return this.context.globalState.get(key, defaultValue)
  }
  cacheSet(key, value) {
    return this.context.globalState.update(key, value)
  }
  register(command, cb) {
    cb && this.context.subscriptions.push(registerCommand(command, cb))
  }
}

class TreeDataItem extends TreeItem {
  constructor(opt = {}) {
    super(opt.label || opt.resourceUri, opt.collapsibleState)

    this.resourceUri = opt.resourceUri
    this.iconPath = opt.iconPath
    this.description = opt.description
    this.tooltip = opt.tooltip  // 鼠标悬浮时显示内容
    this.command = opt.command  // 点击树节点时，执行此命令
    this.contextValue = opt.contextValue
    this.redisDataType = opt.redisDataType
    this.iconPath = path.join(__dirname, '..', 'image', `${this.contextValue}.png`)

    this.type = opt.type
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
  setCollapseState(element) { }
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