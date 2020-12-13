const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, TreeItemCollapsibleState } = require("vscode")
const path = require('path')
const { StreamGroup } = require("./group")
const { redisModel } = require("../../command/redis")
const { IDTreeItem } = require("./id")
const { dateYMD } = require("../../lib/util")

class KeyTreeItem extends TreeDataItem {
  constructor({
    contextValue = NodeType.KEY,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      type: '',
      redisDataType: RedisType.string,
      ...opt
    }
    this.init()
    // this.contextValue = NodeType.KEY
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

    this.command = {
      title: 'Key',
      tooltip: 'key info',
      arguments: [this],
      command: 'redis-stream.key.status'
    }
  }
  init() {
    const { connection, db, redisDataType, label } = this.config
    this.id = `${connection}_${db}_${redisDataType}_${label}.json`
  }
  async getChildren() {
    if (this.redisDataType === RedisType.stream) {
      return this.setStream()
    }
    return []
  }
  async setStream() {
    const data = {
      connection: this.config.connection,
      db: this.config.db,
      redisDataType: this.redisDataType,
      contextValue: NodeType.GORUP,
      stream: this.label,
    }
    const streamInfo = await redisModel.getKey(this.label)
    if (!streamInfo) return []
    this.streamInfo = streamInfo
    const { groups, entries } = streamInfo
    const g = groups.map(i => {
      data.item = i
      data.label = i.name
      data.tooltip = `pel-count: ${i['pel-count']}`
      if (i.pending.length > 0 || i.consumers.length > 0) data.collapsibleState = TreeItemCollapsibleState.Collapsed
      else data.collapsibleState = TreeItemCollapsibleState.None
      return new StreamGroup(data)
    })
    data.collapsibleState = TreeItemCollapsibleState.None
    const ids = entries.map(i => {
      data.item = i.item
      data.label = i.id
      data.contextValue = NodeType.ID
      let at = i.id.match(/(\d+)-?/)
      at = at ? at[1] : ''
      data.tooltip = new Date(+at).format('yy-MM-dd hh:mm:ss')
      return new IDTreeItem(data)
    })
    return [...g, ...ids]
  }
}

module.exports = { KeyTreeItem }