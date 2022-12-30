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
      arguments: [this],
      command: 'redis-stream.key.status'
    }
  }
  static init({ id, ...opt }) {
    opt.id = `${id}.${opt.label}`
    opt.contextValue = NodeType.KEY
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
    const { db, connection, redisModel, redisDataType } = this
    const streamInfo = await redisModel.getStreamInfo(this.label)
    if (!streamInfo) return []
    this.tooltip = `id(${streamInfo.length})`
    const data = {
      db, connection, redisModel, redisDataType,
      stream: this.label,
      collapsibleState: TreeItemCollapsibleState.None
    }
    this.streamInfo = streamInfo
    const { groups, entries = [] } = streamInfo
    let g = groups.map(i => {
      const collapsibleState = (i.pending.length > 0 || i.consumers.length > 0)
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None

      return StreamGroup.init({
        ...data, item: i, label: i.name,
        tooltip: `pel-count: ${i['pel-count']}`,
        collapsibleState
      })
    })
    const ids = entries.map(i => {
      return IDTreeItem.init({
        ...data, item: i.item, label: i.id,
        tooltip: this.id2date(i.id)
      })
    })
    let moreItem = null
    const sLen = streamInfo.length - ids.length
    if (sLen !== 0) moreItem = ShowMoreItem.init({
      ...data,
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

  static init(opt = {}) {
    opt.contextValue = NodeType.SCANMORE
    opt.label = 'Show more ...'
    opt.tooltip = `ID more...`
    return new ShowMoreItem(opt)
  }
}

module.exports = { KeyTreeItem }