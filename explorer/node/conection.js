const { NodeType, Constant } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { RedisModel } = require("../../command/redis")
const { showMsg } = require("../../lib/show-message")
const { createLogger } = require('../../lib/logging')

const log = createLogger('connection')
class ConnectionNode extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    this.opt = opt
    this.name = opt.name
    this.host = opt.host
    this.port = opt.port
    this.password = opt.password
    // this.dbs = opt.dbs
  }
  static init(opt, ctx) {
    // const [name, opt] = kv
    const { host, port, password } = opt
    opt.contextValue = NodeType.CONNECTION
    opt.collapsibleState = TreeItemCollapsibleState.Collapsed
    opt.label = opt.name
    opt.context = ctx
    opt.connection = opt.tooltip = `${host}:${port}`
    opt.id = opt.name

    return new ConnectionNode(opt)
  }

  async getTreeItem(element) {
    console.log('getTreeItem:', element)
    // let { host, port, } = this
    // 只刷新此Item时在这改变属性
    // this.label = 
    // this.connection = this.id = `${host}:${port}`
    return element
  }

  async getChildren() {
    let { host, port, password, db = 0 } = this
    if (!host && !port && !password) log.error('refresh err', opt)
    this.redisModel = RedisModel.reloadRedis({ host, port, password, db })
    this.dbs = await this.redisModel.dbInfo()
      .catch(err => {
        showMsg(`REDIS: ${err},  Pls checked host/port/password`, 'error')
        log.error('connect err', err)
        this.collapsibleState = TreeItemCollapsibleState.None
        RedisModel.delClient({ host, port, password, db })
      })
    if (!this.dbs) return null

    return Object.keys(this.dbs).map(label => {
      const { keys, expires, avg_ttl } = this.dbs[label]
      const db = +label.match(/(\d+)/)[1]
      const { connection, host, port, password, context } = this
      return DbTreeItem.init({
        db, connection, label, host, port, password, context,
        redisModel: db === 0 ? this.redisModel : null,
        description: `(${keys})`,
        tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
        collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      })
    })
  }

}

module.exports = { ConnectionNode }