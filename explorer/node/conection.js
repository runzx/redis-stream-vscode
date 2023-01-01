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
  }

  static init(opt, ctx) {
    const { host, port } = opt
    opt.contextValue = NodeType.CONNECTION
    opt.collapsibleState = TreeItemCollapsibleState.Collapsed
    opt.label = opt.name
    opt.context = ctx
    opt.connection = opt.tooltip = `${host}:${port}`
    opt.id = opt.name

    return new ConnectionNode(opt)
  }

  async getTreeItem(element) {
    // console.log('getTreeItem:', element)
    // 只刷新此Item时在这改变属性
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

    return Object.keys(dbs).map(label => {
      const keys = dbs[label]
      const db = +label.match(/(\d+)/)[1]
      return DbTreeItem.init({ keys, db, ...this.opt })
    })
  }
}

module.exports = { ConnectionNode }