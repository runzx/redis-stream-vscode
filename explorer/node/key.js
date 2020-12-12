const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { ThemeIcon } = require("vscode")
const { redisModel } = require("../../command/redis")


class KeyTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.config = {

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
  init() {
    let res = this.label.match(/(\d+)/)
    this.dbIndex = res ? res[1] : 0
  }
  async getChildren() {
    let keys = await redisModel.getKeys('*', this.dbIndex)
    console.log('dB item getChildren:', keys)
    return keys
  }
}

module.exports = { KeyTreeItem }