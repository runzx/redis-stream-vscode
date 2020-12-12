const ioredis = require('ioredis')
const { RedisBase } = require('../../lib/redis-mq')

const start = async () => {
  let res
  const cli = new RedisBase()
  // const cli = new ioredis()
  // res = cli.server_info
  // await cli.set('demo', 12345)
  // res = await cli.get('demo')

  const [serverInfo, dbs, info] = await cli.serverInfo()
  // res = await cli.info()
  // cli.info().then(res => console.log('res:', res))
  // cli.serverInfo
  console.log(info)
  console.log('res:', res)

  return
}

start().catch(err => console.log('err:', err))