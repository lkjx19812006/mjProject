//机器人加入房间
const WebHttp = require('../common/WebHttp');
class Robs {
  constructor(account, pass, roomId) {
    this.account = account;
    this.pass = pass;
    this.roomId = roomId;
    this.playerId = null;
    this.nickName = null;
    this.headUrl = null;
    this.score = null;
    this.sex = null;
    this.gameUrl = null;
    this.gameClient = null;
    this.login();
  }

  async login() {
    var userInfo = await WebHttp.gameLogin('/user/gameLogin', this.account, this.pass).catch(err => {
      userInfo = null;
    })
    if (!userInfo.data) return;
    console.log(userInfo.data)
    this.gameClient = require('socket.io-client')('ws://' + userInfo.data.gameUrl);
    this.gameClient.on('connect', () => {
      this.nickName = userInfo.data.nickname;
      this.headUrl = userInfo.data.headimgurl;
      this.score = userInfo.data.score;
      this.sex = userInfo.data.sex;
      this.hallUrl = userInfo.data.gameUrl;
      this.id = userInfo.data.id;
      this.gameUrl = userInfo.data.gameUrl;
      var playerInfo = {};
      playerInfo.nickName = this.nickName;
      playerInfo.headUrl = this.headUrl;
      playerInfo.score = this.score;
      playerInfo.playerId = this.id;
      playerInfo.socketId = this.gameClient.id;//客户端连接ID
      playerInfo.gameUrl = this.gameUrl;//游戏链接地址
      playerInfo.playerState = 0;//用户状态0未准备 1准备 2离开
      playerInfo.handCard = [];//用户手牌
      playerInfo.hitCard = [];//用户打的牌
      playerInfo.gang = [];//杠牌
      playerInfo.peng = [];//碰牌

      console.log('机器人加入房间：' + this.roomId);
      this.gameClient.emit('joinRoom', this.roomId, playerInfo, (data) => {
        console.log('机器人' + this.account + '加入房间成功')
        console.log(data)
      })
    });

  }
}
module.exports = Robs