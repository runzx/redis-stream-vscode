
const vscode = require('vscode')
const util = require('util')
const conf = require('../config')

const channel = vscode.window.createOutputChannel(conf.channel)

class Logger {
  constructor(name) {
    this.name = name
  }
  info(msg, ...opt) {
    this.append('INFO', `${msg} ${opt ? util.inspect(opt) : ''}`)
  }
  error(msg, ...opt) {
    this.append('ERROR', `${msg} ${opt ? util.inspect(opt) : ''}`)
  }
  append(type, msg) {
    channel.appendLine(`${new Date().toLocaleTimeString("en-GB")} ${this.name} ${type} ${msg}\n`)
  }
  static createLogger(name) {
    return new Logger(name)
  }
}

module.exports = Logger