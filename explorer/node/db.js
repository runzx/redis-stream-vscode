const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')
const { ThemeIcon } = require("vscode")


class Db extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      ...opt
    }
    this.contextValue = NodeType.DB
    this.iconPath = new ThemeIcon('database', '#fff')
    // path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  getChildren() {

  }
}

module.exports = { Db }