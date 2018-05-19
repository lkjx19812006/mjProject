const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const ServerBlance = require('../common/ServerBlance').instance()

const process = require('process')
const WebHttp = require('../common/WebHttp')
const RedisManager = require('../common/RedisManager')//房间信息操作
const Robs = require('../app/Robs')

//初始化数据库


class HallManager {
  constructor(serverConf, redisConf) {
    if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
      console.log(new Error('HallService 文件初始化错误 未传递port'))
      return;
    }
    this.io = require('socket.io')(serverConf.port, {})
    this.redis = new RedisManager()
    this.init()
  }

  async init() {
    //初始化数据库
    var ok = await DataBaseManager.initDBFromServerConfig()
    if (!ok) {
      console.log(new Error('"数据库初始化错误！请检查'));
      return
    }

    //监听客户端连接
    this.io.on('connection', (socket) => {
      //获取用户信息
      socket.on('getPlayerBaseInfo', async (account, pass, cb) => {
        if (!account || !pass) {
          cb && cb({ ok: false, msg: '信息错误', suc: false })
        }
        console.log(account, pass)
        DataBaseManager.canLogin(account, pass).then(res => {
          console.log(res)
        })


        var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
          infos = null;
        })
        if (infos) {
          cb && cb({ ok: true, msg: '获取成功', suc: true, data: infos })
        } else {
          cb && cb({ ok: true, msg: '获取失败', suc: false, data: infos })
        }
      })


      //创建房间
      socket.on('createroom', async (account, pass, custom, cb) => {
        var roominfo = await WebHttp.getRoomid('/user/getRoomid').catch(err => {
          roominfo = null;
        })
        if (!roominfo) {
          cb({ ok: false, msg: '房间号获取错误', suc: false })
        } else {
          var roomId = roominfo.data.roomId//房间Id
          await this.redis.createRoom(roomId, account)
          cb({ ok: true, suc: true, roomId: roomId })
          //创建房间成功后使用机器人加入房间功能
          setTimeout(function () {
            new Robs(2, 2, roomId);
          })
          setTimeout(function () {
            new Robs(3, 3, roomId);
          })
          setTimeout(function () {
            new Robs(4, 4, roomId);
          })
          // setTimeout(function () {
          //   new Robs(5, 5, roomId);
          // })
        }
      })


    })
  }




}




//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  var redisConf = conf.getConfig('redisCatch');
  new HallManager({ port: process.argv[2] }, redisConf);
}

module.exports = HallManager

