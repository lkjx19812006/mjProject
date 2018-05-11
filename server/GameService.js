const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const process = require('process')
const RedisManager = require('../common/RedisManager') //主要用来做用户信息缓存
const Redis = require('ioredis')//

const WebHttp = require('../common/WebHttp')

class GameService {
  constructor(serverConf, redisConf) {
    if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
      console.log(new Error('GameService 文件初始化错误 未传递port'))
      return;
    }

    this.io = require('socket.io')(serverConf.port, {})
    this.pub = new Redis(redisConf.port, redisConf.ip)
    this.sub = new Redis(redisConf.port, redisConf.ip)
    this.redis = new RedisManager() //获取redis 主要用来操作用户信息


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


      //登陆 连接大厅完成后 执行登陆操作 并设置账号登陆状态
      socket.on('gameLogin', async (account, pass, hallUrl, cb) => {
        if (!account || !pass) {
          cb && cb({ ok: false, msg: '账号或密码为空', suc: false })
        }

        var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
          infos = null;
        })
        if (infos) {
          //写入是否在房间状态
          await this.redis.setSession(infos.id, 'isInGame', true);
          cb && cb({ ok: true, msg: '登陆成功', suc: true, data: infos })
        } else {
          cb && cb({ ok: true, msg: '登陆失败，服务器错误', suc: false, data: infos })
        }

      })

      //获取房间信息
      socket.on('getTableInfos', async (roomId, cb) => {
        var roomInfo = this.redis.getRoomInfo(roomId);
        cb(roomInfo)
      })

      //加入房间 以前有过 更新socketid 没有及新加入
      socket.on('joinRoom', async (roomId, playerInfo, socketid, cb) => {
        //1.先获取房间信息
        //{socketid, playerId, playerState, handCard, hitCard, gang, peng}
        var roomInfo = await this.redis.getRoomInfo(roomId);
        var rooms = roomInfo.rooms || null;
        if (!rooms) { cb(null) }
        var flag = false;//假设当前用户不存在
        rooms.forEach(item => {
          if (item.playerId === playerInfo.id) {
            flag = true;
            item.socketid = socketid;//登陆过可能是掉线或者其他问题 更新socketid 做私密消息使用
          }
        });
        //没有数据 作为新加入
        if (!flag) {
          var obj = {};
          obj.playerId = playerInfo.id;
          obj.score = playerInfo.score;
          obj.socketid = socketid;
          obj.playerState = 0;
          obj.handCard = [];
          obj.hitCard = [];
          obj.gang = [];
          obj.peng = []
        }
      })



    })
  }

}




//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  var redisConf = conf.getConfig('redisCatch');
  new GameService({ port: process.argv[2] }, redisConf);
}

module.exports = GameService

