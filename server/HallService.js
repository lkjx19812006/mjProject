const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const ServerBlance = require('../common/ServerBlance').instance()

const process = require('process')
const RedisManager = require('../common/RedisManager') //主要用来做用户信息缓存
const Redis = require('ioredis')//


const WebHttp = require('../common/WebHttp')

class HallManager {
  constructor(serverConf, redisConf) {
    if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
      console.log(new Error('HallService 文件初始化错误 未传递port'))
      return;
    }

    this.io = require('socket.io')(serverConf.port, {})
    this.redis = new RedisManager() //获取redis 主要用来操作用户信息

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



      //登陆 连接大厅完成后 执行登陆操作 并设置账号登陆状态
      socket.on('authLogin', async (account, pass, hallUrl, cb) => {
        if (!account || !pass) {
          cb && cb({ ok: false, msg: '账号或密码为空', suc: false })
        }
        var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
          infos = null;
        })
        if (infos) {
          //写入用户状态
          await this.redis.setSession(infos.id, 'isLogin', true);
          cb && cb({ ok: true, msg: '登陆成功', suc: true, data: infos })
        } else {
          cb && cb({ ok: true, msg: '登陆失败，服务器错误', suc: false, data: infos })
        }

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
          cb({ ok: false })
        } else {
          //获取分布式服务 游戏服务器
          var gameUrl = ServerBlance.getIp("GameService", account);

          //定义房间信息
          //记录房间成员数组 [{playerId,playerState, handCard, hitCard, gph}] 用户加入房间时添加到数组
          //当前房间状态 roomState 0未开始 1已经开始 2已经结束
          //房间创建者 createAccount 创建房间的用户z
          //房间id  roomid 房间id
          //后续 摸打杠胡状态 暂不定义
          var table = {
            rooms: [],
            roomState: 0,
            createAccount: account,
            roomid: roominfo.data.room
          }
          //存储改房间信息
          await this.redis.createOrSetRoom(roominfo.data.room, table);
          console.log(await this.redis.getRoomInfo(roominfo.data.room))
          cb({ ok: true, suc: true, roomId: roominfo.data.room, gameUrl: gameUrl })
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

