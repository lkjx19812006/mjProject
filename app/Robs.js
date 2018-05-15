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
      var playerInfo = {};
      playerInfo.nickName = this.nickName;
      playerInfo.headUrl = this.headUrl;
      playerInfo.score = this.score;
      playerInfo.playerId = this.id;
      console.log('机器人加入房间：' + this.roomId);
      this.gameClient.emit('joinRoom', this.roomId, playerInfo, this.gameClient.id, (data) => {
        console.log('机器人' + this.account + '加入房间成功')
        console.log(data)
      })
    });

  }


}
module.exports = Robs