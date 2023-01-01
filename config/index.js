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
  PENDING: 'pending', SCANMORE: 'scan-more',
  SEARCHKEY: 'search-key', IDMORE: 'id-more'
}

module.exports = exports = {
  channel: 'ZX-Redis-Stream',
  getVscodeConfigurations,
  NodeType,
}

exports.Constant = {
  GLOBALSTATE_CONFIG_KEY: 'redisOptList',
}

exports.redisOpt = {
  name: 'local',
  host: '127.0.0.1',
  port: 6379,
  password: '',
  db: 0
}

exports.RedisType = {
  hash: 'hash', list: 'list', string: 'string', zset: 'zset', set: 'set',
  stream: 'stream', searchKey: 'searchKey'
}

exports.scheme = {
  VIEW_DOCUMENT_SCHEME: 'redisStream',
  VIEW_DB_KEY_SCHEME: 'redisKey',
  VIEW_STREM_KEY_SCHEME: 'stream-key',
  VIEW_STREM_ID_SCHEME: 'redisStreamID'
}
exports.SHOW_MORE_COUNT = 5