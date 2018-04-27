var process = require('process');

var io = require('socket.io')();

var num = 0;

var redis = require('redis');
var redisClient = redis.createClient;
var pub = redisClient(6379, '127.0.0.1');
var sub = redisClient(6379, '127.0.0.1');

var roomSet = {};


//获取父进程传递端口
var port = parseInt(process.argv[2]);
// var roomid = null;

io.on('connection', function (socket) {

  //客户端请求ws URL:  http://127.0.0.1:6001?roomid=k12_webcourse_room_1
  var roomid = socket.handshake.query.roomid;

  console.log('worker pid: ' + process.pid + ' join roomid: ' + roomid);

  socket.on('join', function (data) {

    socket.join(roomid); //加入房间

    if (!roomSet[roomid]) {
      roomSet[roomid] = {};
      console.log('sub channel ' + roomid);
      sub.subscribe(roomid);
    }
    roomSet[roomid][socket.id] = {};

    reportConnect();

    console.log(data.username + ' join, IP: ' + socket.client.conn.remoteAddress);
    roomSet[roomid][socket.id].username = data.username;
    // io.to(roomid).emit('broadcast_join', data);
    pub.publish(roomid, JSON.stringify({
      "event": 'join',
      "data": data
    }));

  });

  socket.on('say', function (data) {
    console.log("Received Message: " + data.text);
    pub.publish(roomid, JSON.stringify({
      "event": 'broadcast_say',
      "data": {
        username: roomSet[roomid][socket.id].username,
        text: data.text
      }
    }));
  });


  socket.on('disconnect', function () {
    num--;
    console.log('worker pid: ' + process.pid + ' clien disconnection num:' + num);
    process.send({
      cmd: 'client disconnect'
    });

    if (roomSet[roomid] && roomSet[roomid][socket.id] && roomSet[roomid][socket.id].username) {
      console.log(roomSet[roomid][socket.id].username + ' quit');
      pub.publish(roomid, JSON.stringify({
        "event": 'broadcast_quit',
        "data": {
          username: roomSet[roomid][socket.id].username
        }
      }));
    }
    roomSet[roomid] && roomSet[roomid][socket.id] && (delete roomSet[roomid][socket.id]);

  });
});

/**
 * 订阅redis 回调
 * @param  {[type]} channel [频道]
 * @param  {[type]} count   [数量]  
 * @return {[type]}         [description]
 */
sub.on("subscribe", function (channel, count) {
  console.log('worker pid: ' + process.pid + ' subscribe: ' + channel);
});


/**
 * [description]
 * @param  {[type]} channel  [description]
 * @param  {[type]} message
 * @return {[type]}          [description]
 */
sub.on("message", function (channel, message) {
  console.log("message channel " + channel + ": " + message);

  io.to(channel).emit('message', JSON.parse(message));
});

/**
 * 上报连接到master进程 
 * @return {[type]} [description]
 */
var reportConnect = function () {
  num++;
  console.log('worker pid: ' + process.pid + ' client connect connection num:' + num);
  process.send({
    cmd: 'client connect'
  });
};


io.listen(port);

console.log('worker pid: ' + process.pid + ' listen port:' + port);


// const process = require('process')
// const io = require('socket.io')()
// //获取父进程传递的数据 拿到端口号
// const port = process.argv[2];
// //开启链接监听
// io.on('connection', (socket) => {
//   //下面是所有大厅的监听服务
//   var hall = new HallManager(socket);
// })

// class HallManager {
//   constructor(socket) {
//     this.socket = socket;
//     //所有服务名称
//     this.serversName = ['join']
//     this.init()
//   }
//   //初始化事件监听
//   init() {
//     this.serversName.forEach(item => {
//       this.socket.on(item, this[item])
//     })
//   }
//   //服务名称 监听改服务 必须与服务名称对应
//   join(data) {
//     var roomid = this.socket.handshake.query.roomid;
//     socket.join(roomid); //加入房间

//     if (!roomSet[roomid]) {
//       roomSet[roomid] = {};
//       console.log('sub channel ' + roomid);
//       sub.subscribe(roomid);
//     }
//     roomSet[roomid][socket.id] = {};

//     reportConnect();

//     console.log(data.username + ' join, IP: ' + socket.client.conn.remoteAddress);
//     roomSet[roomid][socket.id].username = data.username;
//     // io.to(roomid).emit('broadcast_join', data);
//     pub.publish(roomid, JSON.stringify({
//       "event": 'join',
//       "data": data
//     }));
//   }


// }

// //监听端口
// io.listen(port);

// var redis = require('redis');
// var redisClient = redis.createClient;
// var pub = redisClient(6379, '127.0.0.1');
// var sub = redisClient(6379, '127.0.0.1');