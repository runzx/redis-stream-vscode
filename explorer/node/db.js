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

  getChildren(element) {
    return null
  }
}

class SearchKeysTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
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
    return this.redisModel.searchResult.map(
      ({ key: label, type }) => {
        return KeyTreeItem.init({
          ...this.opt,
          redisDataType: RedisType.searchKey,
          description: type === 'none' ? 'x' : '',
          // `(${type})`,
          tooltip: type,
          label, type,
        })
      })
  }
}

class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
  }

  static init({ id, ...opt }) {
    opt.id = `${id}.db${opt.db}`
    opt.label = `db${opt.db}`
    opt.contextValue = NodeType.DB
    opt.description = `(${opt.keys})`
    opt.redisModel = RedisModel.init(opt)
    opt.collapsibleState = opt.keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
    return new DbTreeItem(opt)
  }

  async getTreeItem(element) {
    console.log('getTreeItem db')
    return element
  }

  async getChildren(e) {
    console.log('getChildren db', e)

    let { redisModel, } = this.opt
    const [keysCategory, scanMore] = await redisModel.scanKeys()
    const [keysLen] = !scanMore ? 0 : this.opt.description.match(/\d+/) || []

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
    if (!isEmpty(redisModel.searchResult)) {
      searchItem = SearchKeysTreeItem.init({
        ...this.opt,
        description: `(${redisModel.searchResult.length})`,
      })
      this.opt.searchItem = searchItem
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