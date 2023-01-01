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
    let data = []
    for (const label of this.item) {
      let description = '', streamInfo, tooltip = ''
      if (this.opt.label === 'stream') {
        streamInfo = await this.opt.redisModel.getStreamInfo(label)
        description = `(${streamInfo.length})`
        tooltip = `updateAt ${this.id2date(streamInfo['last-generated-id'], 'yyyy-MM-dd hh:mm:ss')}`
      }
      data.push({ ...this.opt, label, description, streamInfo, tooltip })
    }
    return data.map(i => KeyTreeItem.init(i))
  }
}

module.exports = { RedisDateTypes }