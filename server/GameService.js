const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const ServerBlance = require('../common/ServerBlance').instance()

const process = require('process')
const Redis = require('ioredis')//用作消息订阅和分发
const Room = require('../app/Room')//房间信息操作

//创建机器人加入房间

class GameService {
  constructor(serverConf, redisConf) {
    if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
      console.log(new Error('GameService 文件初始化错误 未传递port'))
      return;
    }

    this.io = require('socket.io')(serverConf.port, {})
    this.pub = new Redis(redisConf.port, redisConf.ip)
    this.sub = new Redis(redisConf.port, redisConf.ip)
    this.room = Room.instance()

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

  init() {
    //监听客户端连接
    this.io.on('connection', (socket) => {
      var date = new Date().getTime()
      //--------------------------游戏服务开始----------------------------------
      socket.on('joinRoom', async (roomId, playerInfo, socketid, cb) => {
        if (!roomId || !playerInfo || !socketid || !cb) {
          cb && cb({ ok: false, suc: false })
          return
        }
        //校验坐位人数
        var oldRoomInfo = await this.room.getRoomInfo(roomId);
        if (oldRoomInfo.rooms.length >= 4) {
          cb && cb({ ok: true, suc: false, msg: '当前房间人数已满，请换个房间' })
          return;
        }


        //更新房间信息
        var newRoomInfo = await this.room.joinRoom(roomId, playerInfo, socketid);
        socket.join(roomId)
        //订阅当前房间
        this.sub.subscribe(roomId);
        cb && cb({ ok: true, suc: true, data: newRoomInfo });
        //广播用户加入消息
        this.pub.publish(roomId, JSON.stringify({
          "event": 'joinRoom',
          "data": newRoomInfo
        }));
        console.log('当前加入房间用时：' + (new Date().getTime() - date))
      })


      //---------------------------游戏服务结束---------------------------------
    })
  }

}




//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  var redisConf = conf.getConfig('redisCatch');
  new GameService({ port: process.argv[2] }, redisConf);
}

module.exports = GameService

