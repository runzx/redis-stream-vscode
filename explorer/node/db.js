const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { RedisModel } = require("../../command/redis")
const { RedisDateTypes } = require("./type")
const { KeyTreeItem } = require("./key")
const { isEmpty } = require("../../lib/util")
const { createLogger } = require('../../lib/logging')
const { initVdoc } = require("../../editor/v-doc")

const log = createLogger('db')

class ShowMoreKeysTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.isShowMoreItem = true

    this.command = {
      title: 'More',
      tooltip: 'scan more',
      arguments: [opt.refreshParent],
      command: 'redis-stream.db.scan'
    }
  }

  static init({ id, ...opt }) {
    opt.id = `${id}.more`
    opt.contextValue = NodeType.SCANMORE
    opt.label = 'Show more ...'
    opt.tooltip = `SCAN more...`
    return new ShowMoreKeysTreeItem(opt)
  }
}

class SearchKeysTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    // this.isShowMoreItem = true
  }

  static init({ id, ...opt }) {
    opt.id = `${id}.search`
    opt.contextValue = NodeType.SEARCHKEY
    opt.label = 'search key'
    opt.tooltip = `Search result`
    opt.collapsibleState = TreeItemCollapsibleState.Expanded
    return new SearchKeysTreeItem(opt)
  }
  async getChildren() {
    const { db, connection, redisModel, } = this
    const redisDataType = RedisType.searchKey
    const item = this.redisModel.searchResult
    return this.redisModel.searchResult.map(({ key: label, type }) => {
      return KeyTreeItem.init({
        ...this.opt, redisDataType,
        label, type,
        // db, connection, redisModel,
        tooltip: `${type}`
      })
    })
  }
}

class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    // this.opt = opt
    // this.context = opt.context
  }
  static init({ id, ...opt }) {
    opt.id = `${id}.db${opt.db}`
    opt.label = `db${opt.db}`
    opt.contextValue = NodeType.DB
    opt.description = `(${opt.keys})`
    opt.redisModel = RedisModel.init(opt)

    // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
    opt.collapsibleState = opt.keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
    return new DbTreeItem(opt)
  }
  async getTreeItem(element) {
    // let { host, port, password, db, redisModel, label, } = this
    // if (!this.redisModel) {
    //   this.redisModel = RedisModel.init({ host, port, password, db })
    // }
    // let dbsInfo = await this.redisModel.dbInfo()
    // const keys = dbsInfo[label]
    // this.description = `(${keys})`
    return element
  }
  async getChildren() {
    let { redisModel, } = this.opt
    // const redisModel = RedisModel.init(this.opt)
    // const vDocView = initVdoc(this.opt)
    const [keysCategory, scanMore] = await redisModel.scanKeys()
    // log('DB', db, keysCategory, scanMore)
    const [keysLen] = this.opt.description.match(/\d+/) || []

    const categroys = Object.keys(keysCategory).map(label => {

      return RedisDateTypes.init({
        ...this.opt, label,

        redisDataType: label,
        item: keysCategory[label],
        description: `(${keysCategory[label].length})`,
        collapsibleState: TreeItemCollapsibleState.Collapsed
      })
    })

    let searchItem = null
    if (redisModel && !isEmpty(redisModel.searchResult)) {
      searchItem = SearchKeysTreeItem.init({
        ...this.opt
      })
    }

    let scanMoreItem = null
    if (scanMore < +keysLen) {
      scanMoreItem = ShowMoreKeysTreeItem.init({
        ...this.opt,
        description: `(${+keysLen - scanMore})`,
        refreshParent: this
      })
    }
    return [...categroys, searchItem, scanMoreItem]
  }
}

module.exports = { DbTreeItem }