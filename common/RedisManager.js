//redis主要做用户信息session
const Redis = require('ioredis')
const conf = require('../common/Config').instance()
class RedisManager {
  constructor() {
    this.conf = conf.getConfig('redisCatch');
    this.redis = new Redis(this.conf.port, this.conf.ip);
  }

  //设置用户session
  async setSession(playerId, key, value) {
    //先拿 没有默认为空对象
    var result = await this.redis.get(playerId) || '{}';
    result = JSON.parse(result)
    result[key] = value
    await this.redis.multi().set(playerId, JSON.stringify(result)).exec();
  }

  async getSession(playerId) {
    var result = await this.redis.get(playerId).catch(err => {
      result = null
    })
    return Promise.resolve(JSON.parse(result))
  }


  //创建或设置房间
  async createOrSetRoom(roomid, roomInfo) {
    await this.redis.multi().set(roomid, JSON.stringify(roomInfo)).exec();
  }

  async getRoomInfo(roomid) {
    var result = await this.redis.get(roomid).catch(err => {
      result = null
    })
    return Promise.resolve(JSON.parse(result))
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

module.exports = RedisManager
