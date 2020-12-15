const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { RedisModel } = require("../../command/redis")
const { RedisDateTypes } = require("./type")
const { log } = require("../../lib/logging")


class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.host = opt.host
    this.port = opt.port
    this.password = opt.password
    this.context = opt.context
  }
  static init(opt = {}) {
    opt.contextValue = NodeType.DB

    return new DbTreeItem(opt)
  }
  async getChildren() {
    let { connection, host, port, password, db, redisModel, context } = this
    if (!redisModel) {
      redisModel = RedisModel.init({ host, port, password, db })
    }
    const keysCategory = await redisModel.getKeysByAllCategory()
    log('DB', db, keysCategory)
    return Object.keys(keysCategory).map(label => {
      return RedisDateTypes.init({
        db, connection, label, redisModel,

        redisDataType: label,
        item: keysCategory[label],
        description: `(${keysCategory[label].length})`,
        collapsibleState: TreeItemCollapsibleState.Collapsed
      })
    })
  }
}

module.exports = { DbTreeItem }