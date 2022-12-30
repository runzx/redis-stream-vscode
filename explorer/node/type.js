const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { KeyTreeItem } = require("./key")


class RedisDateTypes extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)

  }
  static init({ id, ...opt }) {
    opt.id = `${id}.${opt.label}`
    // opt.label = `db${opt.db}`
    opt.contextValue = NodeType.REDISDATATYPE
    return new RedisDateTypes(opt)
  }
  async getChildren() {
    // const { db, connection, redisModel, redisDataType } = this
    return this.item.map(label => {
      return KeyTreeItem.init({
        ...this.opt, label,
        // db, connection, redisModel, redisDataType
      })
    })
  }
}

module.exports = { RedisDateTypes }