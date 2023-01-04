const { constants } = require('fs')
const { access, mkdir, unlink, writeFile } = require('node:fs/promises')
const path = require('path')
const vscode = require("vscode")
const { NodeType, RedisType } = require("../config")
const { isEmpty, } = require('../lib/util')
const { createLogger } = require('../lib/logging')
const { showMsg } = require('../lib/show-message')
// const { writeFile } = require('fs/promises')
// const { getValueFrUri } = require('../editor/v-doc')
const { readFile } = require('fs/promises')
const { setValueFrUri, getValueFrUri } = require('../command/redis')

const log = createLogger('explorer')
const { TreeItemCollapsibleState, EventEmitter, TreeItem, } = vscode
const { registerCommand, } = vscode.commands

class TreeExplorer {
  rootPath = ''
  wsDir = ''
  constructor(context,) {
    this.context = context
    this.subscriptions = context.subscriptions
    this.provider = null
    // this.initDir()
    this.initSaveEvent()
  }
  async initFile(dumpFile = '.zx.json') {
    if (!vscode.workspace.workspaceFolders) {
      showMsg('请先打开一个工作空间', 'error')
      return true
    }
    const wsFolder = vscode.workspace.workspaceFolders.find(f => f.uri.scheme === 'file')
    if (!wsFolder) return true

    this.rootPath = wsFolder.uri.fsPath
    await access(`${this.rootPath}/.vscode`, constants.F_OK)
      .catch(async err => {
        console.log(`.vscode/ ${err ? 'does not exist' : 'exists'}`)
        await mkdir(`${this.rootPath}/.vscode`)
      })
    await access(`${this.rootPath}/.vscode/${dumpFile}`, constants.F_OK).then(async () => {
      await unlink(`${this.rootPath}/.vscode/${dumpFile}`).catch(err => {
        console.error(err)
      })
    }).catch(err => {
      console.log(`.vscode/${dumpFile} ${err ? 'does not exist' : 'exists'}`)
    })
  }

  async initDir(dir = '.zx-redis') {
    if (!vscode.workspace.workspaceFolders) {
      showMsg('Pls Open Folder.(请先打开一个工作空间)', 'error')
      return true
    }
    const wsFolder = vscode.workspace.workspaceFolders.find(f => f.uri.scheme === 'file')
    if (!wsFolder) return true

    this.rootPath = wsFolder.uri.fsPath
    this.wsDir = path.join(this.rootPath, '.vscode')
    // `${this.rootPath}/.vscode`
    await access(this.wsDir, constants.F_OK)
      .catch(async err => {
        // console.log(`.vscode/ ${err ? 'does not exist' : 'exists'}`)
        await mkdir(this.wsDir)
      })
    this.wsDir = path.join(this.wsDir, dir)
    // `/${dir}`
    await access(this.wsDir, constants.F_OK)
      .catch(async err => {
        await mkdir(this.wsDir)
      })
  }
  async openResource(element) {
    if (!this.wsDir && await this.initDir()) return

    const filename = path.join(this.wsDir, element.id) + `.json`
    const content = await this.genContent(path.basename(filename))
    await writeFile(filename, content)
      .then(() => {
        vscode.workspace.openTextDocument(filename)
          .then(doc => vscode.window.showTextDocument(doc))
      })
      .catch(err => {
        showMsg('生成临时文件异常' + err.message, 'error')
        console.error(err)
      })
  }
  async genContent(filePath) {
    let res = await getValueFrUri(filePath)
    try {
      if (res.type === 'string') res.value = JSON.parse(res.value)
    } catch (e) { }

    return JSON.stringify(res, null, 2)
  }
  initSaveEvent() {
    vscode.workspace.onDidSaveTextDocument(async e => {
      console.log('onDidSaveTextDocument:', e)
      let file = path.parse(e.uri._fsPath)
      // e.uri.path.replace(`${this.rootPath}/.vscode/`, '')
      console.log(file)
      if (path.parse(file.dir).base !== '.zx-redis') return

      let content = await readFile(e.uri._fsPath, 'utf8')
      if (!content) return
      try {
        let { key, type, value } = JSON.parse(content) || {}
        if (!key || !type) return showMsg('key, type 不能为空')

        let res = await setValueFrUri(file.base, value)
        if (res) return showMsg(res)

      } catch (e) { }

    })
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
    log.info('getChildren', element ? element.label : '')
    if (element) return element.getChildren(element)

    return this._getChileren()
  }

  // refresh getTreeItem -> getChildren
  async getTreeItem(element) {
    // log.info('getTreeItem', element.label)

    element.refresh = (e, cb) => {
      cb && (e.refreshCallBack = cb)
      this.refresh(e)
    }
    if (this._getTreeItem) return this._getTreeItem(element)

    return element
  }

  refresh(item) {
    log.info('TreeDataProvider refresh', item.id)
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

  setCollapseState() {
  }

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