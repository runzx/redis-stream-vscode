const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { ThemeIcon } = require("vscode")


class DbTreeItem extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      ...opt
    }
    this.contextValue = NodeType.DB
    this.iconPath = new ThemeIcon('database', '#fff')
    // path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)
    this.command = {
      title: 'Info',
      tooltip: 'redis server info',
      arguments: [],
      command: 'redis-stream.db.status'
    }
  }
  getChildren() {

  }
}

module.exports = { DbTreeItem }