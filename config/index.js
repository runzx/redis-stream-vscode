
const getVscodeConfigurations = (vscode) => {
  const wsConfiguration = vscode.workspace.getConfiguration()
  // const connectsConfig = wsConfiguration.get('mongoRunner.connections')
  // const connectConfig = wsConfiguration.get('mongoRunner.connection')
  // if (Array.isArray(connectsConfig)) {
  //   return connectsConfig
  // }
  // return [connectConfig]
  return wsConfiguration
}

const NodeType = {
  CONNECTION: 'connection', DB: 'db',
  FOLDER: 'folder', REDISDATATYPE: 'redisdatatype',
  KEY: 'key', INFO: "info"
}

module.exports = exports = {
  channel: 'zx-redis-stream',
  getVscodeConfigurations,
  NodeType,
}

exports.RedisType = {
  hash: 'hash', list: 'list', string: 'string', zset: 'zset', set: 'set',
  stream: 'stream'
}