//redis主要做用户信息session
const Redis = require('ioredis')
const conf = require('../common/Config').instance()
class RedisManager {
  constructor(io, Serverport) {
    this.conf = conf.getConfig('redisCatch');
    this.redis = new Redis(this.conf.port, this.conf.ip);
  }


  //重置客户端加入数量
  static resetClientNum() {
    this.redis.multi().set('clientNum', 0).get('clientNum').exec((err, results) => {
      // results === [[null, 'OK'], [null, 'bar']]
      if (!err) {
        console.log('当前客户端链接数量：' + 0)
      }
    });
  }


  //设置当前客户端加入数量
  static setClientNum(type) {
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

module.exports = RedisManager
