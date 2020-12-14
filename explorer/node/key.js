const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, TreeItemCollapsibleState } = require("vscode")
const { StreamGroup } = require("./group")
const { redisModel } = require("../../command/redis")
const { IDTreeItem } = require("./id")
const { dateYMD } = require("../../lib/util")

class KeyTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'Key',
      tooltip: 'key info',
      arguments: [this],
      command: 'redis-stream.key.status'
    }
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.KEY
    // const { connection, db, redisDataType, label } = opt
    // opt.id = `${connection}_${db}_${redisDataType}_${label}.json`
    return new KeyTreeItem(opt)
  }
  async getChildren() {
    if (this.redisDataType === RedisType.stream) {
      return this.setStream()
    }
    return []
  }
  async setStream() {
    const streamInfo = await redisModel.getKey(this.label)
    if (!streamInfo) return []

    const data = {
      connection: this.connection,
      db: this.db,
      redisDataType: this.redisDataType,
      stream: this.label,
      collapsibleState: TreeItemCollapsibleState.None
    }
    this.streamInfo = streamInfo
    const { groups, entries } = streamInfo
    const g = groups.map(i => {
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
      let at = i.id.match(/(\d+)-?/)
      at = at ? at[1] : ''
      return IDTreeItem.init({
        ...data, item: i.item, label: i.id,
        tooltip: new Date(+at).format('yy-MM-dd hh:mm:ss')
      })
    })
    return [...g, ...ids]
  }
}

module.exports = { KeyTreeItem }