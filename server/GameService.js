const conf = require('../common/Config').instance();
const process = require('process')
const GameHandler = require('../app/GameHandler')
const redisConf = conf.getConfig('redisCatch')
const Redis = require('ioredis')//用作消息订阅和分发

class GameService {
  constructor(serverConf) {
    if (!serverConf || !serverConf.port) {
      console.log(new Error('GameService 文件初始化错误 未传递port'))
      return;
    }
    this.io = require('socket.io')(serverConf.port, {})
    this.pub = new Redis(redisConf.port, redisConf.ip)
    this.sub = new Redis(redisConf.port, redisConf.ip)

    //开启订阅功能
    this.sub.on("subscribe", (channel, count) => {
      console.log('订阅当前的id为: ' + process.pid + ' 订阅的号: ' + channel);
    })

    //订阅消息事件
    this.sub.on("message", (channel, message) => {
      console.log("详细的订阅号" + channel + ": " + message);
      this.io.to(channel).emit('message', JSON.parse(message));
    });


    this.init()
  }

  async init() {
    //监听客户端连接
    this.io.on('connection', (socket) => {
      this.gameHandler = new GameHandler(socket, this.io, this.sub, this.pub)
    })
  }

}


//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  new GameService({ port: process.argv[2] });
}

module.exports = GameService

