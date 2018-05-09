const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
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

      socket.on('getSession', async (playerId, cb) => {
        var result = await this.redis.getSession(playerId).catch(err => {
          result = null;
        });
        cb(result)
      })



      //1登陆 连接大厅完成后 执行登陆操作 并设置账号登陆状态
      socket.on('authLogin', async (account, pass, hallUrl, cb) => {
        if (!account || !pass) {
          cb && cb({ ok: false, msg: '账号或密码为空', suc: false })
        }

        var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
          infos = null;
        })
        if (infos) {
          //写入用户状态
          await this.redis.setSession(infos.id, 'isLogin', true); //写入用户登陆状态
          cb && cb({ ok: true, msg: '登陆成功', suc: true, data: infos })
        } else {
          cb && cb({ ok: true, msg: '登陆失败，服务器错误', suc: false, data: infos })
        }

      })

      //2获取用户信息
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
      socket.on('createroom', async (cb) => {
        var roominfo = await WebHttp.getRoomid('/user/getRoomid').catch(err => {
          roominfo = null;
        })
        if (!roominfo) {
          cb({ ok: false })
        } else {
          cb({ ok: true, suc: true, roomId: roominfo.data.room })
          console.log('获取房间号' + roominfo.data.room)
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

