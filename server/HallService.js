const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const ServerBlance = require('../common/ServerBlance').instance()

const process = require('process')
const WebHttp = require('../common/WebHttp')
const Room = require('../app/Room')

class HallManager {
  constructor(serverConf, redisConf) {
    if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
      console.log(new Error('HallService 文件初始化错误 未传递port'))
      return;
    }
    this.io = require('socket.io')(serverConf.port, {})
    this.room = Room.instance()
    this.init()
  }

  init() {
    //监听客户端连接
    this.io.on('connection', (socket) => {
      //1客户端调用io方法 链接到大厅服务器
      // 1.1客户端监听到链接成功后立马校验用户的账号，密码
      // 1.2校验成功后 返回给用户的account、pass、score、nickname、id、大厅链接（hallUrl）
      // 1.3设置用户登陆状态 为true

      socket.on('getSession', async (playerId, cb) => {
        var result = await this.redis.getSession(playerId).catch(err => {
          result = null;
        });
        cb(result)
      })


      //获取用户信息
      socket.on('getPlayerBaseInfo', async (account, pass, cb) => {
        if (!account || !pass) {
          cb && cb({ ok: false, msg: '信息错误', suc: false })
        }
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
          var newRoomInfo = await this.room.createRoom(roominfo.data.room, account)
          cb({ ok: true, suc: true, roomId: newRoomInfo.roomId })
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

