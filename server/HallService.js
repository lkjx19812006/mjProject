
// /**
//  * 上报连接到master进程 
//  * @return {[type]} [description]
//  */
// var reportConnect = function () {
//   num++;
//   console.log('worker pid: ' + process.pid + ' client connect connection num:' + num);
//   process.send({
//     cmd: 'client connect'
//   });
// };

const conf = require('../common/Config')
const process = require('process')
const RedisServer = require('./RedisServer')

class HallManager {
  constructor(port) {
    //获取父进程传递的数据 拿到端口号
    this.port = port;//获取实例化的端口号
    this.io = null;
    this.redis = null;
    this.roomSet = {};
    this.eventName = ['join', 'say', 'disconnect']
    this.init()
  }
  //初始化事件监听
  init() {
    if (!this.port) {
      return new Error('port is not defined')
    }
    //监听端口
    this.io = require('socket.io')(this.port, {})

    //设置redis
    this.redis = new RedisServer(this.io, this.port)

    //开启链接
    this.io.on('connection', (socket) => {
      const roomid = socket.handshake.query.roomid;//获取链接地址中的房间号
      console.log('链接成功过')
      //配置事件监听
      socket.on('join', data => { this.join(socket, data) })//加入房间
      socket.on('say', data => { this.say(socket, data) })//说话
      socket.on('disconnect', () => { this.disconnect(socket, roomid) })//用户退出

    })
  }

  //服务名称 监听该服务 必须与服务名称对应
  join(socket, data) {
    console.log(socket)
    socket.join(data.roomid); //加入房间

    if (!this.roomSet[data.roomid]) {
      this.roomSet[data.roomid] = {};
      console.log('sub channel ' + data.roomid);
      this.redis.sub.subscribe(data.roomid);
    }
    this.roomSet[data.roomid][socket.id] = {};

    // reportConnect();

    console.log(data.username + ' join, IP: ' + socket.client.conn.remoteAddress);
    this.roomSet[data.roomid][socket.id].username = data.username;

    //发布加入的消息
    this.redis.pub.publish(data.roomid, JSON.stringify({
      "event": 'join',
      "data": data
    }));

    this.redis.setClientNum('join')
  }

  say(socket, data) {
    this.redis.pub.publish(data.roomid, JSON.stringify({
      "event": 'broadcast_say',
      "data": {
        username: this.roomSet[data.roomid][socket.id].username,
        text: data.text
      }
    }));
  }

  //客户端退出
  disconnect(socket, roomid) {
    console.log(this.io)
    if (this.roomSet[roomid] && this.roomSet[roomid][socket.id] && this.roomSet[roomid][socket.id].username) {
      console.log(this.roomSet[roomid][socket.id].username + ' quit');
      this.redis.pub.publish(roomid, JSON.stringify({
        "event": 'broadcast_quit',
        "data": {
          username: this.roomSet[roomid][socket.id].username
        }
      }));
      this.redis.setClientNum('quit')
    }
  }

}

//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  new HallManager(process.argv[2]);
  console.log('多进程启动')
}

module.exports = HallManager

