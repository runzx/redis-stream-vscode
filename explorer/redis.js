

const { TreeItemCollapsibleState } = require('vscode')
const { TreeExplorer, TreeDataProvider, TreeDataItem } = require('./explorer')
const { ConnectionNode } = require('./node/conection')

class RedisTreeItem extends ConnectionNode {
  constructor({ label, id, iconPath, command,
    resourceUri, tooltip, collapsibleState }) {
    super({ label, id, iconPath, command, resourceUri, tooltip, collapsibleState })

  }
  // getChileren(element) { }

}

class RedisTreeDataProvider extends TreeDataProvider {
  constructor() {
    super()
    this.treeData = [new RedisTreeItem({ label: 'rootZx', collapsibleState: TreeItemCollapsibleState.Collapsed })]
  }
  // element->state->Collapsed 第一次点击会触发 getChileren()->getTreeItem()
  _getChileren(element) {
    if (!element) {
      const config = this.getConnections()
      return Object.keys(config).map(key => {
        return new ConnectionNode(key, config[key])
      })
    } else {
      return element.getChildren()
    }
  }
  _getTreeItem(element) {
    return element
    const { label, tooltip } = element
    return {
      label,
      tooltip: 'my ' + tooltip + ' item'
    }
  }
}

class RedisTree extends TreeExplorer {
  constructor(context) {
    super(context)
    this.initTree('targetTree1', new RedisTreeDataProvider())
  }
}

module.exports = {
  RedisTree
}