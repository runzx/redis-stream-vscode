# redis-stream for vscode !

Welcome to the redis-stream extension for vscode!

## Features

* json file  to edit redis value (通过 json 格式文件可修改 redis key 的 value)
* 2022 年升级可同时管理多个 redis server.
* MQ by redis stream, can delayQueue: [redis-stream-queue](https://github.com/runzx/redis-stream-queue) . use: `npm i redis-stream-queue`
* 延时队列 采用双 stream 队列保证订阅消息(`__keyevent@5__:expired`)不丢失
* easy use GUI to access Redis stream data.
* test data for MQ on redis stream
* key use SCAN, stream use XREVRARNGE.
* terminal, historys

## Extension Settings

1. button('refresh redis') can init/refresh redis, format -> `host:port:password`

   [![ioredis](https://www.bosstg.cn/assets/img/redis-stream-start.png)](https://github.com/runzx/redis-stream-vscode)

2. host/port/password must input one, '`:6379`', '`::password`', defalut-> `127.0.0.1:6379`

   [![ioredis](https://www.bosstg.cn/assets/img/redis-stream-vscode-4.JPG)](https://github.com/runzx/redis-stream-vscode)

3. search key
   [![ioredis](https://www.bosstg.cn/assets/img/redis-stream-vscode-3.JPG)](https://github.com/runzx/redis-stream-vscode)

4. stream access need redis V5+.

   **Enjoy!**
