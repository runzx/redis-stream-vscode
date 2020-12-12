

const vscode = require("vscode")
const { NodeType } = require("../config")
const { TreeItemCollapsibleState, EventEmitter, TreeItem, Uri } = vscode
const { registerCommand, registerTextEditorCommand } = vscode.commands

class TreeExplorer {
  constructor(context, openExplorerCommand) {
    this.context = context
    this.subscriptions = context.subscriptions
    this._onDidChangeTreeData = new EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event

    // this.openExplorerCommand = openExplorerCommand
  }

  initTree(viewId, treeDataProvider) {
    this.subscriptions.push(
      vscode.window.createTreeView(viewId, { treeDataProvider }))
  }
  register(command, cb) {
    cb && this.subscriptions.push(registerCommand(command, cb))
  }
  showDoc(uri) {
    vscode.window.showTextDocument(uri)
  }

}

class TreeDataProvider {
  constructor() {
    this.treeData = null
  }
  async getChildren(element) {
    if (!element && this.treeData) {
      return this.treeData
    }
    if (element && !this._getChileren) return element.getChildren() //  [] null 不会调用getTreeItem()

    return this._getChileren(element)
  }
  async getTreeItem(element) {
    if (this._getTreeItem) return this._getTreeItem(element)

    return element
  }
}

class TreeDataItem extends TreeItem {
  constructor({ label, id, iconPath, command,
    resourceUri, tooltip,
    collapsibleState = TreeItemCollapsibleState.None } = {}) {
    super(label || resourceUri, collapsibleState)
    // this.label = label
    // this.resourceUri = resourceUri
    // this.id = id
    // this.iconPath = iconPath

    // this.tooltip = tooltip  // 鼠标悬浮时显示内容
    // this.collapsibleState = collapsibleState  // 树节点是应该展开还是折叠
    // this.command = command  // 点击树节点时，执行此命令
  }
  getChildren() { }
  getCollapseState(element) {
    if (element.contextValue === NodeType.KEY
      || element.contextValue === NodeType.INFO)
      return TreeItemCollapsibleState.None

  }
  setCollapseState(element) {

  }
  register(command, cb) {
    registerCommand(command, cb)
    // cb && this.subscriptions.push(registerCommand(command, cb))
  }
}

module.exports = { TreeExplorer, TreeDataProvider, TreeDataItem }