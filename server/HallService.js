const conf = require('../common/Config').instance();
const process = require('process')
const RedisManager = require('../common/RedisManager') //主要用来做用户信息缓存
const Redis = require('ioredis')//

const HallManager = function (serverConf, redisConf) {
  if (!serverConf || !serverConf.port || !redisConf || !redisConf.port) {
    console.log(new Error('HallService 文件初始化错误 未传递port'))
    return;
  }

  //初始化通讯相关
  let io = require('socket.io')(serverConf.port, {})
  let pub = new Redis(redisConf.port, redisConf.ip)
  let sub = new Redis(redisConf.port, redisConf.ip)
  let redis = new RedisManager() //获取redis 主要用来操作用户信息

  //开启订阅功能
  sub.on("subscribe", (channel, count) => {
    console.log('订阅当前的id为: ' + process.pid + ' 订阅的号: ' + channel);
  })

  //订阅消息事件
  sub.on("message", (channel, message) => {
    console.log("详细的订阅号" + channel + ": " + message);
    io.to(channel).emit('message', JSON.parse(message));
  });

  //监听客户端连接
  io.on('connection', (socket) => {
    //登陆 连接大厅完成后 执行登陆操作 并设置账号登陆状态
    socket.on('login', async (data) => {

    })


    //加入房间
    socket.on('joinRoom', async (data) => {
      socket.join(data.roomid); //加入房间

      //订阅房间消息
      sub.subscribe(data.roomid);

      //发布加入的消息
      pub.publish(data.roomid, JSON.stringify({
        "event": 'join',
        "data": data
      }));

    })

    socket.on('clearRoom', async (account, pass, cb) => {
      //调用接口获取房间id号
      console.log(account, pass)

      cb && cb('测试创建房间')
    })



  })

  //server



}

//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  var redisConf = conf.getConfig('redisCatch');
  HallManager({ port: process.argv[2] }, redisConf);
}

module.exports = HallManager

