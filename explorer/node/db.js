const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { redisModel } = require("../../command/redis")
const { RedisDateTypes } = require("./type")
const { log } = require("../../lib/logging")


class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)

  }
  static init(opt = {}) {
    opt.contextValue = NodeType.DB
    // opt.id = this.getId(opt)
    // let res = opt.label.match(/(\d+)/)
    // opt.dbIndex = res ? res[1] : 0
    return new DbTreeItem(opt)
  }
  async getChildren() {
    let keysCategory = await redisModel.getKeysByAllCategory(this.db)
    log('DB', keysCategory)
    return Object.keys(keysCategory).map(label => {
      return RedisDateTypes.init({
        connection: this.connection,
        db: this.db,
        redisDataType: label,
        item: keysCategory[label],
        description: `(${keysCategory[label].length})`,
        label,
        // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: TreeItemCollapsibleState.Collapsed
      })
    })
  }
}

module.exports = { DbTreeItem }