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
    // opt.id = this.getId(opt)
    return new RedisDateTypes(opt)
  }
  async getChildren() {
    return this.item.map(label => {
      const data = {
        connection: this.connection,
        db: this.db,
        redisDataType: this.redisDataType,
        label,
      }
      return KeyTreeItem.init(data)
    })
  }
}

module.exports = { RedisDateTypes }