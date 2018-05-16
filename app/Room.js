const RedisManager = require('../common/RedisManager') //主要用来做用户信息缓存
//房间数据模板
function RoomTemp() {
  this.rooms = [];
  this.roomState = 0;//0已创建 1发牌中 2游戏中 3游戏结束 4房间失效
  this.createAccount = null;
  this.roomId = null;
}
//房间成员数据模板
function RoomsTemp() {
  this.playerInfo = {};//用户信息
  this.socketid = null;//用户socket连接的id
  this.playerState = 0;//用户状态0未准备 1准备 2离开
  this.handCard = [];//用户手牌
  this.hitCard = [];//用户打的牌
  this.gang = [];//杠牌
  this.peng = [];//碰牌
}

const errorInfo = {
  Player_Not_In_Game: {
    code: 1000,
    info: "玩家不在游戏当中"
  },
  Player_Not_Login: {
    code: 1001,
    info: "还没有登录"
  },
  Game_Not_Exsit: {
    code: 2001,
    info: "游戏不存在或者已经解散"
  },
  Game_Table_Full: {
    code: 2002,
    info: "座位已满"
  },
  Game_Action_Not_Valid: {
    code: 2003,
    info: "操作无效 "
  }
}


class Room {
  constructor() {
    this.redis = new RedisManager() //获取redis 主要用来操作用户信息
  }
  //加入房间执行函数
  static instance() {
    if (Room.g_instance === null) {
      Room.g_instance = new Room()
    }
    return Room.g_instance
  }

  //创建房间
  async createRoom(roomId, account) {
    var roomInfo = new RoomTemp()
    roomInfo.roomId = roomId;
    roomInfo.createAccount = account;
    await this.redis.createRoom(roomId, roomInfo);
    //这里可能有点问题
    var newRoomInfo = await this.redis.getRoomInfo(roomId)
    return Promise.resolve(newRoomInfo)
  }



  //获取房间信息
  async getRoomInfo(roomId) {
    var roomInfo = await this.redis.getRoomInfo(roomId);
    return Promise.resolve(roomInfo);
  }

  async getRoomInfoFilterRoomsKey(roomId, filerKey) {
    var afterRoomInfo = await this.redis.getRoomInfoFilterRoomsKey(roomId, filerKey);//去掉手牌信息
    return Promise.resolve(afterRoomInfo)
  }



  //加入房间 实现思路
  async joinRoom(roomId, playerInfo, socketid) {
    //1.获取当前房间信息
    if (!isInRoom && rooms.length < 4) {
      //没有在房间中
      var newPlayerRoom = new RoomsTemp();//获取座位模板
      newPlayerRoom.playerInfo = playerInfo;//设置该座位下的用户信息
      newPlayerRoom.socketid = socketid;//设置该作为下的socketid 私密消息用
      roomInfo.rooms.push(newPlayerRoom);//房间添加座位信息    
    }
    this.redis.joinRoom(roomId, playerInfo);//更新房间信息    
    return Promise.resolve(newRoomInfo)
  }

}
Room.g_instance = null;
module.exports = Room