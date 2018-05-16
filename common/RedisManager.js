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


  //创建或设置房间 并返回创建的信息
  async createRoom(roomId, account) {
    this.redis.set('room:roomId:' + roomId + ':state', 0)//设置房间状态0
    this.redis.set('room:roomId:' + roomId + ':playerNum', 0)//设置当前房间人数
    this.redis.set('room:roomId:' + roomId + ':createAccount', account)//设置当前创建者
  }

  //加入房间 并返回该房间的信息
  async joinRoom(roomId, playerRoomInfo) {
    //判断该用户信息是否存在
    var key = 'room:roomId:' + roomId + ':userId:' + playerRoomInfo.playerId;
    var result = await this.redis.get(key);
    if (!result) {//没有该键设置键
      this.redis.set(key, JSON.stringify(playerRoomInfo))//该房间的用户信息
      this.redis.incr('room:roomId:' + roomId + ':playerNum')//设置房间人数   
    } else {
      //更新用户信息 可能做到掉线处理
      result = JSON.parse(result);
      playerRoomInfo.playerState = result.playerState;//用户状态0未准备 1准备 2离开
      playerRoomInfo.handCard = result.handCard;//用户手牌
      playerRoomInfo.hitCard = result.hitCard;//用户打的牌
      playerRoomInfo.gang = result.gang;//杠牌
      playerRoomInfo.peng = result.peng;//碰牌
      this.redis.set(key, JSON.stringify(playerRoomInfo))//该房间的用户信息
    }
  }

  //获取房间信息
  async getRoomInfo(roomId) {
    var roomInfo = {
      rooms: [],
      state: 0,//0已创建 1发牌中 2游戏中 3游戏结束 4房间失效
      createAccount: null,
      playerNum: 0
    }
    //获取当前房间的所有用户的key
    var useKeys = await this.redis.keys('room:roomId:' + roomId + ':userId:\*');
    var roomUserInfos = await this.redis.mget(useKeys);
    roomUserInfos.forEach(item => {
      roomInfo.rooms.push(JSON.parse(item))
    })
    roomInfo.state = Number(await this.redis.get('room:roomId:' + roomId + ':state') || 0)
    roomInfo.createAccount = await this.redis.get('room:roomId:' + roomId + ':createAccount');
    roomInfo.playerNum = Number(await this.redis.get('room:roomId:' + roomId + ':playerNum') || 0);
    return Promise.resolve(roomInfo)
  }

  //获取当前房间人数
  async getRoomPlayerNum(roomId) {
    return await this.redis.get('room:roomId:' + roomId + ':playerNum');//获取当前房间下的人数
  }

  //获取房间信息 去掉房间中用户信息 rooms 中某一个key
  async getRoomInfoFilterRoomsKey(roomId, key) {
    var roomInfo = await this.getRoomInfo(roomId);
    if (!roomInfo) {
      return Promise.resolve({})
    } else {
      roomInfo.rooms.forEach(item => {
        item[key] = null;
      })
      return Promise.resolve(roomInfo)
    }
  }

}

module.exports = RedisManager
