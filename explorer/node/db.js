const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { redisModel } = require("../../command/redis")
const { RedisDateTypes } = require("./type")


class DbTreeItem extends TreeDataItem {
  constructor({
    contextValue = NodeType.DB,
    ...opt
  } = {}) {
    super({ contextValue, ...opt })
    this.config = {
      connection: '127.0.0.1@6379',
      contextValue,
      ...opt
    }
    this.init()
    // this.contextValue = contextValue
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  init() {
    let res = this.label.match(/(\d+)/)
    this.dbIndex = res ? res[1] : 0
  }
  async getChildren() {
    let keysCategory = await redisModel.getKeysByAllCategory(this.dbIndex)
    console.log('dB item getChildren:', keysCategory)
    return Object.keys(keysCategory).map(label => {

      return new RedisDateTypes({
        connection: this.config.connection,
        db: this.dbIndex,
        redisDataType: label,
        items: keysCategory[label],
        description: `(${keysCategory[label].length})`,
        // id: 'id:' + label, description: `(${keys})`,
        label,
        // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: TreeItemCollapsibleState.Collapsed
      })
    })
  }
}

module.exports = { DbTreeItem }