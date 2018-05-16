const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const ServerBlance = require('../common/ServerBlance').instance()

const process = require('process')
const Redis = require('ioredis')//用作消息订阅和分发
const RedisManager = require('../common/RedisManager')//房间信息操作

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
    this.redis = new RedisManager();

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
      socket.on('joinRoom', async (roomId, playerInfo, cb) => {
        if (!roomId || !playerInfo) {
          cb && cb({ ok: false, suc: false })
          return
        }
<<<<<<< HEAD
        //1.先获取房间信息
        //房间信息格式
        //var table = {
        //   rooms: [],
        //   roomState: 0,
        //   createAccount: account,
        //   roomid: roominfo.data.room
        // }
        //{socketid, playerInfo, playerState, handCard, hitCard, gang, peng}//后期可能还会有吃的牌 暂时不做
        var roomInfo = await this.redis.getRoomInfo(roomId);
        var rooms = roomInfo.rooms || null;
        if (!rooms) { cb(null) }
        var flag = false;//假设当前用户不在该房间中


        rooms.forEach(item => {
          if (item.playerInfo.playerId === playerInfo.playerId) {
            flag = true;
            item.socketid = socketid;//登陆过可能是掉线或者其他问题 更新socketid 做私密消息使用
          }
        });
        //没有数据 作为新加入
        if (!flag) {
          var obj = {};
          obj.playerInfo = playerInfo;
          obj.socketid = socketid;
          obj.playerState = 0;
          obj.handCard = [];
          obj.hitCard = [];
          obj.gang = [];
          obj.peng = []
          roomInfo.rooms.push(obj);
          await this.redis.createOrSetRoom(roomId, roomInfo);
        }
        //新用户加入 设置房间用户信息
        if (roomInfo.rooms.length <= 4) {
          socket.join(roomId)
          //订阅当前房间
          this.sub.subscribe(roomId);
          var afterRoomInfo = await this.redis.getRoomInfoFilterRoomsKey(roomId, 'handCard');//去掉手牌信息
          console.log('用户加入房间后的房间信息')
          console.log(afterRoomInfo)

          cb && cb({ ok: true, suc: true, data: afterRoomInfo })
          //广播用户加入消息
          this.pub.publish(roomId, JSON.stringify({
            "event": 'joinRoom',
            "data": afterRoomInfo
          }));
        } else {
=======
        //校验坐位人数
        var playerNum = await this.redis.getRoomPlayerNum(roomId);
        if (playerNum >= 4) {
>>>>>>> 07c477840c803b066938d99d23cd65d0c1af7051
          cb && cb({ ok: true, suc: false, msg: '当前房间人数已满，请换个房间' })
          return;
        }
        //更新房间信息
        await this.redis.joinRoom(roomId, playerInfo);
        socket.join(roomId)
        //订阅当前房间
        this.sub.subscribe(roomId);

        var newRoomInfo = await this.redis.getRoomInfoFilterRoomsKey(roomId, 'handCard')
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

