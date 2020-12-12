const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon } = require("vscode")
const path = require('path')

class KeyTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.config = {
      connection: '127.0.0.1@6379',
      db: 'db0',
      redisDataType: RedisType.string,
      ...opt
    }
    // this.init()
    this.contextValue = NodeType.KEY
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

    this.command = {
      title: 'Key',
      tooltip: 'key info',
      arguments: [this],
      command: 'redis-stream.key.status'
    }
  }
  // init() { }
  // async getChildren() { }
}

module.exports = { KeyTreeItem }