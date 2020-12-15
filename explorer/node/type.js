const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")


class RedisDateTypes extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)

  }
  static init(opt) {
    opt.contextValue = NodeType.REDISDATATYPE
    return new RedisDateTypes(opt)
  }
  async getChildren() {
    const { db, connection, redisModel, redisDataType } = this
    return this.item.map(label => {
      return KeyTreeItem.init({
        label,
        db, connection, redisModel, redisDataType
      })
    })
  }
}

module.exports = { RedisDateTypes }