const { NodeType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const path = require('path')


class ConnectionNode extends TreeDataItem {
  constructor(opt) {
    super(opt)
    this.config = {
      ...opt
    }
    this.contextValue = NodeType.CONNECTION
    this.iconPath = path.join(__dirname, '..', '..', 'image', `${this.contextValue}.png`)

  }
  getChildren() {

  }
}

module.exports = { ConnectionNode }