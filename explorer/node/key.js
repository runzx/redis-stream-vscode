const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, TreeItemCollapsibleState } = require("vscode")
const { StreamGroup } = require("./group")
const { IDTreeItem } = require("./id")
const { dateYMD } = require("../../lib/util")

class KeyTreeItem extends TreeDataItem {
  streamIdCount = {}

  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'Key',
      tooltip: 'key info',
      arguments: [opt],
      command: 'redis-stream.key.status'
    }
  }

  static init({ id, ...opt }) {
    opt.id = `${id}.${opt.label}`
    opt.contextValue = NodeType.KEY
    // opt.scheme = `${opt.redisDataType}-${opt.contextValue}`
    opt.collapsibleState = opt.redisDataType === 'stream' ? TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.None
    return new KeyTreeItem(opt)
  }

  async getChildren() {
    if (this.redisDataType === RedisType.stream
      || this.type === RedisType.stream) {
      return this.setStream()
    }
    return []
  }

  async setStream() {
    const { redisModel } = this.opt
    const streamInfo = await redisModel.getStreamInfo(this.label)
    if (!streamInfo) return []
    this.tooltip = `id(${streamInfo.length})`
    // const data = {
    //   db, connection, redisModel, redisDataType,
    //   stream: this.label,
    //   collapsibleState: TreeItemCollapsibleState.None
    // }
    // this.streamInfo = streamInfo
    const { groups, entries = [] } = streamInfo
    this.opt.stream = this.label
    let g = groups.map(i => {
      const collapsibleState = (i.pending.length > 0 || i.consumers.length > 0)
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None

      return StreamGroup.init({
        ...this.opt,
        item: i, label: i.name,
        tooltip: `pel-count: ${i['pel-count']}`,
        collapsibleState
      })
    })
    const ids = entries.map(i => {
      return IDTreeItem.init({
        ...this.opt,
        item: i.item,
        description: '',
        label: i.id,
        collapsibleState: TreeItemCollapsibleState.None,
        tooltip: this.id2date(i.id)
      })
    })
    let moreItem = null
    const sLen = streamInfo.length - ids.length
    if (sLen !== 0) moreItem = ShowMoreItem.init({
      ...this.opt,
      refreshParent: this,
      description: `(${sLen})`,
    })
    return [...g, ...ids, moreItem]
  }
}

class ShowMoreItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.isShowMoreItem = true

    this.command = {
      title: 'More',
      tooltip: 'ID more',
      arguments: [opt.refreshParent],
      command: 'redis-stream.stream.showMore'
    }
  }

  static init({ id, ...opt }) {
    opt.id = `${id}.more`
    opt.contextValue = NodeType.SCANMORE
    opt.label = 'Show more ...'
    opt.tooltip = `ID more...`
    return new ShowMoreItem(opt)
  }

  getChildren(element) {
    return null
  }
}

module.exports = { KeyTreeItem }