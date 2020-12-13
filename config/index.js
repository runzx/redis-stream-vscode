

const getVscodeConfigurations = (vscode) => {
  const wsConfiguration = vscode.workspace.getConfiguration()
  // const connectsConfig = wsConfiguration.get('mongoRunner.connections')
  return wsConfiguration
}

const NodeType = {
  CONNECTION: 'connection', DB: 'db',
  FOLDER: 'folder', REDISDATATYPE: 'redisdatatype',
  KEY: 'key', INFO: "info",
  GORUP: 'group', CONSUMER: 'consumer', ID: 'id',
  PENDING: 'pending'
}

module.exports = exports = {
  channel: 'zx-redis-stream',
  getVscodeConfigurations,
  NodeType,
}

exports.Constant = {
  GLOBALSTATE_CONFIG_KEY: 'redisOpt',
}

exports.redisOpt = {
  host: '127.0.0.1',
  port: 6379,
  password: '',
  db: 0
}

exports.RedisType = {
  hash: 'hash', list: 'list', string: 'string', zset: 'zset', set: 'set',
  stream: 'stream'
}