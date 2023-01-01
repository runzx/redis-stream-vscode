const { NodeType, Constant } = require("../../config")
const { TreeDataItem } = require("../explorer")
const { TreeItemCollapsibleState } = require("vscode")
const { DbTreeItem } = require("./db")
const { RedisModel, connectRedis, getDbs } = require("../../command/redis")
const { showMsg } = require("../../lib/show-message")
const { createLogger } = require('../../lib/logging')

const log = createLogger('connection')
class ConnectionNode extends TreeDataItem {
  constructor(opt = {}) {
    super(opt)
    // this.opt = opt
    // this.name = opt.name
    // this.host = opt.host
    // this.port = opt.port
    // this.password = opt.password
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
    if (!this.opt.client) {
      const { code, message, client, version, os, redisInfo } = await connectRedis(this.opt).catch(err => {
        let { code, message, } = err
        if (code === 'EADDRNOTAVAIL') message = '密码不正确，请检查'
        else if (code === 'ECONNREFUSED') message = `redis 拒绝，请检查 host:${this.opt.host},port:${this.opt.port}`
        showMsg(`${code || ''} >> ${message}`, 'error')
        return { code, message, }
      })
      if (message || code) {
        return log.error('connect getChildren:', message)
      }
      // notify(message)
      Object.assign(this.opt, { client, redisVersion: version, os, redisInfo })
      // return this.setting.refresh() // 改变 icon 状态
    }
    let dbs = await getDbs(this.opt.client)

    // let { host, port, password, db = 0 } = this
    // if (!host && !port && !password) log.error('refresh err', opt)
    // this.redisModel = RedisModel.reloadRedis({ host, port, password, db })
    // this.dbs = await this.redisModel.dbInfo()
    //   .catch(err => {
    //     showMsg(`REDIS: ${err},  Pls checked host/port/password`, 'error')
    //     log.error('connect err', err)
    //     this.collapsibleState = TreeItemCollapsibleState.None
    //     RedisModel.delClient({ host, port, password, db })
    //   })
    // if (!this.dbs) return null

    return Object.keys(dbs).map(label => {
      const keys = dbs[label]
      const db = +label.match(/(\d+)/)[1]
      return DbTreeItem.init({ keys, db, ...this.opt })
      // const { connection, host, port, password, context } = this
      // return DbTreeItem.init({
      //   db, connection, label, host, port, password, context,
      //   redisModel: db === 0 ? this.redisModel : null,
      //   description: `(${keys})`,
      //   tooltip: `expires:${expires},avg_ttl:${avg_ttl}`,
      //   collapsibleState: keys !== 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
      // })
    })
  }

}

module.exports = { ConnectionNode }