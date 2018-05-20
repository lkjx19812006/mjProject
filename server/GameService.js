const conf = require('../common/Config').instance();
const process = require('process')
const GameHandler = require('../app/GameHandler')
const redisConf = conf.getConfig('redisCatch')
const Redis = require('ioredis')//用作消息订阅和分发
const RedisManager = require('../common/RedisManager')//房间信息操作
class GameService {
  constructor(serverConf) {
    if (!serverConf || !serverConf.port) {
      console.log(new Error('GameService 文件初始化错误 未传递port'))
      return;
    }
    this.io = require('socket.io')(serverConf.port, {})
    this.pub = new Redis(redisConf.port, redisConf.ip)
    this.sub = new Redis(redisConf.port, redisConf.ip)
    this.redis = new RedisManager()

    //开启订阅功能
    this.sub.on("subscribe", (channel, count) => {
      console.log('订阅当前的id为: ' + process.pid + ' 订阅的号: ' + channel);
    })

    //订阅消息事件
    this.sub.on("message", async (channel, message) => {
      console.log('正在发送消息:%o', message)
      message = JSON.parse(message);
      var sendData = {
        event: message.event,
        data: message.data
      }
      if (message.socketId) {//发送私密消息
        this.io.to(message.socketId).emit('message', sendData)
      } else {//发送普通消息
        this.io.in(channel).emit('message', sendData)
      }
    });


    this.init()
  }

  //获取socketId 通过位置
  async getSocketIdWidthPos(pos, roomId) {
    var roomInfo = await this.redis.getRoomInfo(roomId);
    var rooms = (roomInfo && roomInfo.rooms) || []
    return rooms[pos].socketId
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

