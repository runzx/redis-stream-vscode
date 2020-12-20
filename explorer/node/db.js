const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { RedisModel } = require("../../command/redis")
const { RedisDateTypes } = require("./type")
const { log } = require("../../lib/logging")
const { KeyTreeItem } = require("./key")
const { isEmpty } = require("../../lib/util")


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

  static init(opt = {}) {
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

  static init(opt = {}) {
    opt.contextValue = NodeType.SEARCHKEY
    opt.label = 'search key'
    opt.tooltip = `Search result`
    opt.collapsibleState = TreeItemCollapsibleState.Expanded
    return new SearchKeysTreeItem(opt)
  }
  async getChildren() {
    const { db, connection, redisModel, } = this
    const redisDataType = 'searchResult'
    const item = this.redisModel.searchResult
    return this.redisModel.searchResult.map(({ key: label, type }) => {
      return KeyTreeItem.init({
        label, redisDataType,
        db, connection, redisModel,
        tooltip: `${type}`
      })
    })
  }
}

class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.host = opt.host
    this.port = opt.port
    this.password = opt.password
    this.context = opt.context
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.DB

    return new DbTreeItem(opt)
  }
  async getChildren() {
    let { connection, host, port, password, db, redisModel, context, description } = this
    if (!redisModel) {
      redisModel = RedisModel.init({ host, port, password, db })
    }
    const [keysCategory, scanMore] = await redisModel.scanKeys()
    log('DB', db, keysCategory, scanMore)
    const [keysLen] = description.match(/\d+/)
    const categroys = Object.keys(keysCategory).map(label => {

      return RedisDateTypes.init({
        db, connection, label, redisModel,

        redisDataType: label,
        item: keysCategory[label],
        description: `(${keysCategory[label].length})`,
        collapsibleState: TreeItemCollapsibleState.Collapsed
      })
    })
    let searchItem = null
    if (this.redisModel && !isEmpty(this.redisModel.searchResult)) {
      searchItem = SearchKeysTreeItem.init({
        db, connection, redisModel
      })
    }
    let scanMoreItem = null
    if (scanMore !== +keysLen) {
      scanMoreItem = ShowMoreKeysTreeItem.init({
        db, connection, redisModel,
        description: `(${+keysLen - scanMore})`,
        refreshParent: this
      })
    }
    return [...categroys, searchItem, scanMoreItem]
  }
}

module.exports = { DbTreeItem }