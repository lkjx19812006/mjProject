const DataBaseManager = require('../../dbManager/DataBaseManager').instance()
const IDs = require('../../common/IDs').instance()
const Roomids = require('../../common/Roomids').instance()
const ServerBlance = require('../../common/ServerBlance').instance()

const RedisManager = require('../../common/RedisManager') //主要用来做用户信息缓存
const redis = new RedisManager()

class User {
  constructor() {

  }
  async testLogin(req, res) {
    //1.获取客户端传递账号
    //2.判断账号是否被注册
    //3.如果注册直接返回account pass hallUrl code； 如果没有注册注册新账号
    var account = req.body.account;
    if (!account) {
      res.status(400).send({ ok: true, msg: '请输入账号', code: '00e0' })
      return
    };

    var playerInfo = await DataBaseManager.findPlayer(account);

    if (playerInfo) {//有用户 直接返回
      var hallUrl = ServerBlance.getIp("HallService", playerInfo.openid);
      res.status(200).send({ ok: true, msg: '请求成功', code: "1c0e", data: { account: playerInfo.account, pass: playerInfo.pass, hallUrl: hallUrl } })
    } else {//注册用户
      //id, openid, unionid, nickname, sex, headimgurl, account, pass, score
      var id = await IDs.getID();
      var userinfo = await DataBaseManager.createPlayer(
        id,
        account,
        account,
        '测试',
        1,
        'http://i4.cfimg.com/583278/00e2ef22ec67b9b0.jpg',
        account,
        account,
        0
      );
      var hallUrl = ServerBlance.getIp("HallService", userinfo.openid);
      res.status(200).send({ ok: true, msg: '用户创建成功', code: "1c0e", data: { account: userinfo.account, pass: userinfo.pass, hallUrl: hallUrl } })
    }
  }

  //获取当前房间号
  async getRoomids(req, res) {
    var roomids = await Roomids.getID();
    res.status(200).send({ ok: true, msg: '获取成功', code: "1c0e", data: { room: roomids } })
  }

  //大厅登陆校验
  async hallLogin(req, res) {
    var account = req.body.account;
    var pass = req.body.pass;
    if (!account || !pass) {
      res.status(400).send({ ok: true, msg: '请输入账号或', code: '00e0' })
      return
    };
    var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
      infos = null;
    })
    if (infos) {
      //写入用户状态
      await redis.setSession(infos.id, 'isLogin', true);
      var hallUrl = ServerBlance.getIp("HallService", account);
      infos.hallUrl = hallUrl
      res.status(200).send({ ok: true, msg: '登陆成功', code: "1c0e", data: infos })
    } else {
      res.status(400).send({ ok: true, msg: '服务器错误', code: '00e0' })
    }

  }


  //大厅登陆校验
  async gameLogin(req, res) {
    var account = req.body.account;
    var pass = req.body.pass;
    if (!account || !pass) {
      res.status(400).send({ ok: true, msg: '请输入账号或', code: '00e0' })
      return
    };
    var infos = await DataBaseManager.canLogin(account, pass).catch(err => {
      infos = null;
    })
    if (infos) {
      //写入用户状态
      await redis.setSession(infos.id, 'isInGame', true);
      var gameUrl = ServerBlance.getIp("GameService", account);
      infos.gameUrl = gameUrl
      res.status(200).send({ ok: true, msg: '登陆成功', code: "1c0e", data: infos })
    } else {
      res.status(400).send({ ok: true, msg: '服务器错误', code: '00e0' })
    }
  }

}

module.exports = User
