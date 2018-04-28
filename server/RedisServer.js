//redis
const Redis = require('ioredis')
const conf = require('../common/Config').instance()
class RedisServer {
  constructor(io, Serverport) {
    this.conf = conf.getConfig('services')['RedisService'];
    this.port = this.conf['port']
    this.ip = this.conf['ip'];

    this.redis = new Redis(this.port, this.ip);
    this.pub = new Redis(this.port, this.ip);
    this.sub = new Redis(this.port, this.ip);
    this.io = io;
    this.Serverport = Serverport;

    this.resetClientNum()
    this.init()
  }

  init() {
    this.sub.on('error', (err) => {
      console.log("Error " + err);
    })



    /**
    * 订阅redis 回调
    * @param  {[type]} channel [频道]
    * @param  {[type]} count   [数量]  
    * @return {[type]}         [description]
    */
    this.sub.on("subscribe", (channel, count) => {
      console.log('worker pid: ' + process.pid + ' subscribe: ' + channel);
    })

    /**
     * [description]
     * @param  {[type]} channel  [description]
     * @param  {[type]} message
     * @return {[type]}          [description]
     */
    this.sub.on("message", (channel, message) => {
      console.log("message channel " + channel + ": " + message + '----Serverport:' + this.Serverport);
      this.io.to(channel).emit('message', JSON.parse(message));
    });



  }

  //重置客户端加入数量
  resetClientNum() {
    this.redis.multi().set('clientNum', 0).get('clientNum').exec((err, results) => {
      // results === [[null, 'OK'], [null, 'bar']]
      if (!err) {
        console.log('当前客户端链接数量：' + 0)
      }
    });
  }


  //设置当前客户端加入数量
  setClientNum(type) {
    this.redis.get('clientNum', (err, result) => {
      var clientNum = 0;
      if (result) {
        clientNum = parseInt(result);
      }
      if (type === 'join') {//加入
        clientNum++
      } else if (type === 'quit') {//离开
        clientNum--
      }
      this.redis.multi().set('clientNum', clientNum).get('clientNum').exec((err, results) => {
        // results === [[null, 'OK'], [null, 'bar']]
        if (!err) {
          console.log('当前客户端链接数量：' + results[1][1])
        }
      });
    });

  }
}

module.exports = RedisServer
