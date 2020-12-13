
const path = require('path')
const vscode = require("vscode")
const { NodeType, RedisType } = require("../config")
const { TreeItemCollapsibleState, EventEmitter, TreeItem, Uri } = vscode
const { registerCommand, registerTextEditorCommand } = vscode.commands

class TreeExplorer {
  constructor(context, openExplorerCommand) {
    this.context = context
    this.subscriptions = context.subscriptions
    this.provider = null
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
  async getTreeItem(element) {
    element.refresh = (e) => { this.refresh(e) }
    if (this._getTreeItem) return this._getTreeItem(element)

    return element
  }
  refresh(data) {
    this.refreshMsg = data
    this._onDidChangeTreeData.fire()
  }
  cacheGet(key, defaultValue) {
    return this.context.globalState.get(key, defaultValue)
  }
  cacheSet(key, value) {
    return this.context.globalState.update(key, value)
  }
}

class TreeDataItem extends TreeItem {
  constructor({ label = '', id, iconPath, command,
    resourceUri, tooltip, description,
    collapsibleState, contextValue, redisDataType,
    connection = '127.0.0.1:6379', db = 0,
    item, stream } = {}) {
    super(label || resourceUri, collapsibleState)
    // this.label = label
    // this.collapsibleState = collapsibleState  // 树节点是应该展开还是折叠
    this.resourceUri = resourceUri
    this.id = id
    console.log('id:', id)
    this.iconPath = iconPath
    this.description = description
    this.tooltip = tooltip  // 鼠标悬浮时显示内容

    this.command = command  // 点击树节点时，执行此命令
    this.contextValue = contextValue
    this.redisDataType = redisDataType

    this.iconPath = path.join(__dirname, '..', 'image', `${this.contextValue}.png`)
    this.collapsibleState = collapsibleState || this.getCollapseState(this)

    this.connection = connection
    this.db = db
    this.item = item
    this.stream = stream
  }
  // getChildren() { }
  getCollapseState(element) {
    if (element.contextValue === NodeType.KEY
      && element.redisDataType === RedisType.stream)
      return TreeItemCollapsibleState.Collapsed

    if (element.contextValue === NodeType.KEY
      || element.contextValue === NodeType.ID
      || element.contextValue === NodeType.INFO)
      return TreeItemCollapsibleState.None
  }

  setCollapseState(element) { }
}

module.exports = { TreeExplorer, TreeDataProvider, TreeDataItem }