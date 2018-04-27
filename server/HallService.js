const process = require('process')
const io = require('socket.io')()
//获取父进程传递的数据 拿到端口号
const port = process.argv[2];
//开启链接监听
io.on('connection', (socket) => {
  //下面是所有大厅的监听服务
  var hall = new HallManager(socket);
})

class HallManager {
  constructor(socket) {
    this.socket = socket;
    //所有服务名称
    this.serversName = ['join']
    this.init()
  }
  //初始化事件监听
  init() {
    this.serversName.forEach(item => {
      this.socket.on(item, this[item])
    })
  }
  //服务名称 监听改服务 必须与服务名称对应
  join(data, cb) {
    cb && cb(data)
  }
  

}

//监听端口
io.listen(port);
