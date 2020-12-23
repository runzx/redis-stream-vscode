
const vscode = require('vscode')
const util = require('util')
const conf = require('../config')

const channel = vscode.window.createOutputChannel(conf.channel)

class Logger {
  constructor(name) {
    this.name = name
  }
  out(msg, ...opt) {
    this.append('', `${msg} ${opt ? util.inspect(opt) : ''}`)
  }
  info(msg, ...opt) {
    this.append('INFO', `${msg} ${opt ? util.inspect(opt) : ''}`)
  }
  error(msg, ...opt) {
    this.append('ERROR', `${msg} ${opt ? util.inspect(opt) : ''}`)
  }
  append(type, msg) {
    channel.appendLine(`${new Date().toLocaleTimeString("en-GB")} [${this.name.toUpperCase()}] ${type} ${msg}\n`)
  }
  static createLogger(name) {
    return new Logger(name)
  }
}

module.exports = exports = (name) => { return new Logger(name) }

exports.log = (...opt) => { return new Logger('test').out(...opt) }