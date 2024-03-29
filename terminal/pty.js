const { EventEmitter } = require("vscode")
const { lexer } = require("./lexer")
const { ClientV2: Client } = require('@camaro/redis')

const KEY = 'terminalHistorys'
const HISTORY_LEN = 16


class Pty {
  writeEmitter = new EventEmitter()
  onDidWrite = this.writeEmitter.event
  dbIndex = 0
  cursor = 0
  input = []
  historyIndex = 0
  histories
  tag = '💻 > '

  constructor(redisItem, fn, context) {
    this.redisItem = redisItem
    this.dbIndex = redisItem.db || 0
    this.name = redisItem.name || ' '
    this.sysTag(redisItem.name)
    this.fn = fn
    this.context = context
    this.histories = this.cacheGet([])
    this.historyIndex = this.histories.length
    this.client = new Client(redisItem) // host, port,password,db
    this.client.on('error', (err) => {
      // data: ['message','somechannel','this is the message']
      console.error(err.message);
    })
  }
  sysTag() {
    this.tag = `💻 ${this.name}:${this.dbIndex} > `
  }
  w(str = this.tag) {
    this.writeEmitter.fire(str)
  }

  open() {
    // this.writeEmitter.fire('✨ 🌏❤️❤️ \r\n')
    // this.writeEmitter.fire('💻 >')
    this.w('✨ 🌏❤️❤️ \r\n')
    this.w()
  }

  close() {
    this.fn()
  }

  async handleInput(data) {
    // console.log('handleInput:', data)
    for (let i = 0; i < data.length; i++) {
      const char = data[i]
      switch (char.charCodeAt(0)) {
        case 3: // ctrl+c
          this.cursor = 0
          this.input = []
          this.writeEmitter.fire('^C\r\n')
          break
        case 10: // \n
        case 13: // \r
          await this.finishInput()
          this.cursor = 0
          this.input = []
          break
        case 27: // (Left, Right, Up, Down) are (27 91 68, 27 91 67, 27 91 65, 27 91 66)
          const next1 = data[++i]?.charCodeAt(0)
          const next2 = data[++i]?.charCodeAt(0)
          if (next1 === 91) {
            switch (next2) {
              case 68: // Left
                this.cursor = Math.max(0, this.cursor - 1)
                break
              case 67: // Right
                this.cursor = Math.min(this.input.length, this.cursor + 1)
                break
              case 65: // Up 历史记录
                this.searchUp()
                this.cursor = this.input.length
                break
              case 66: // Down
                this.searchDown()
                this.cursor = this.input.length
                break
              default:
                break
            }

          }
          break
        case 127: // \b
          this.input.splice(this.cursor - 1, 1)
          this.cursor = Math.max(0, this.cursor - 1)
          break
        default:
          this.input.splice(this.cursor, 0, char)
          this.cursor++
      }
    }

    // Move cursor to start.
    this.w('\x1b[G')
    // Clears from cursor to end of line.
    this.w('\x1b[0K')

    this.w()
    this.w(this.input.join(''))

    this.w('\x1b[G')
    // 移动光标到指定位置
    this.w(`\x1b[${this.tag.length + this.cursor}C`)
  }

  async finishInput() {
    const input = this.input.join('').trim()
    switch (input) {
      case '':
        this.w('\r\n')
        return
      case 'clear':
        this.w('\x1b[2J')
        this.w('\x1b[0;0f')
        return
    }

    const inputToken = lexer.analyze(this.input)
    let [command, args] = inputToken
    // 保存历史记录
    this.appendToHistory(command + ' ' + args.join(' '))
    // console.log('command: %s, args: %s', command, args)
    command = command.toLowerCase()
    let result
    try {
      if (!this.client[command]) result = 'not this command.(没有此命令)'
      else result = await this.client[command](...args)
    } catch (err) {
      console.error(err)
      result = err.message
    }

    if (command === 'select') {
      this.dbIndex = args[0]
      this.sysTag()
    }
    this.w('\r\n')
    if (Array.isArray(result)) result = result.join('\n\r')
    else result += ''
    this.w(result)
    this.w('\r\n')
  }

  searchUp() {
    --this.historyIndex < 0 && (this.historyIndex = 0)

    if (!this.histories[this.historyIndex]) {
      this.input = []
      return
    }

    this.input = this.histories[this.historyIndex].split('')
  }

  searchDown() {
    if (++this.historyIndex > this.histories.length) {
      this.historyIndex = this.histories.length
    }

    if (!this.histories[this.historyIndex]) {
      this.input = []
      return
    }

    this.input = this.histories[this.historyIndex].split('')
  }

  appendToHistory(params) {
    if (this.histories.includes(params)) {
      let start = this.histories.indexOf(params)
      if (start === this.histories.length - 1) {
        this.historyIndex = this.histories.length
        return
      }
      this.histories.splice(start, 1)
    }
    this.histories.push(params)
    if (this.histories.length > HISTORY_LEN) this.histories.shift()
    this.historyIndex = this.histories.length
    this.cacheSet(this.histories)
  }
  cacheGet(defaultValue) {
    return this.context.globalState.get(KEY, defaultValue)
  }
  cacheSet(value) {
    return this.context.globalState.update(KEY, value)
  }
}

module.exports = Pty