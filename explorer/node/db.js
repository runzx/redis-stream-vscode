const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { ThemeIcon, ThemeColor, TreeItemCollapsibleState } = require("vscode")
const { redisModel } = require("../../command/redis")
const { KeyTreeItem } = require("./key")


class DbTreeItem extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.config = {

      ...opt
    }
    this.init()
    this.contextValue = NodeType.DB
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  init() {
    let res = this.label.match(/(\d+)/)
    this.dbIndex = res ? res[1] : 0
  }
  async getChildren() {
    let keys = await redisModel.getKeys('*', this.dbIndex)
    console.log('dB item getChildren:', keys)
    keys = keys.slice(0, 50)
    return keys.map(label => {
      // const { keys, expires, avg_ttl } = dbs[label]
      return new KeyTreeItem({
        // id: 'id:' + label, description: `(${keys})`,
        label,
        // tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: TreeItemCollapsibleState.None
      })
    })
  }
}

module.exports = { DbTreeItem }