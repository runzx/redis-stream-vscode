const { NodeType, RedisType } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { StreamConsumer } = require("./consumer")
const { StreamPending } = require("./pending")

class StreamGroup extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.command = {
      title: 'GROUP',
      tooltip: 'stream GROUP info',
      arguments: [this],
      command: 'redis-stream.group.status'
    }
  }

  static init({ id, ...opt }) {
    opt.id = `${id.replace('.stream.', '.s-group.')}.${opt.label}`
    opt.contextValue = NodeType.GORUP
    return new StreamGroup(opt)
  }

  async getChildren() {
    const { pending, consumers } = this.item
    const c = consumers.map(i => {
      return StreamConsumer.init({
        ...this.opt,
        item: i,
        label: i.name,
        tooltip: `pel-count: ${i['pel-count']}`,
        collapsibleState: i.pending.length > 0
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None
      })
    })

    return [...c, StreamPending.init({
      ...this.opt,
      item: pending,
      label: 'pending',
      tooltip: 'length: ' + this.item['pel-count'],
      collapsibleState: pending.length > 0
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    })]

  }

  async getTreeItem(parent) {
    let { host, port, password, db, refreshCallBack, stream } = this
    const [item] = (await this.redisModel.getGroupInfo(stream)).filter(i => i.name === this.label)
    this.item = item
    refreshCallBack && refreshCallBack(item)
    return this
  }
}

module.exports = { StreamGroup }