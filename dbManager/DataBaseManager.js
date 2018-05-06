const MongooseAsync = require('../common/MongooseAsync')
const conf = require('../common/Config').instance()
class DataBaseManager {
  constructor() {
    this.inited = false;
  }

  static instance() {
    if (DataBaseManager.g_Instance == null) {
      DataBaseManager.g_Instance = new DataBaseManager()
    }
    return DataBaseManager.g_Instance
  }

  async initDB(account, pass, ip, port, dbname) {
    if (this.inited == true) return;
    this.inited = true;
    this.mog = new MongooseAsync();
    var isOk = await this.mog.connect(account, pass, ip, port, dbname);
    if (isOk) {//定义表
      this.mog.makeModel('userinfo',
        {
          id: Number,
          openid: String,
          unionid: String,
          nickname: String,
          sex: Number,
          headimgurl: String,
          account: String,
          pass: String,
          loginTime: Date,
          createTime: Date,
          score: Number
        }
      );
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }

  async initDBFromServerConfig() {
    var dbConfig = conf.getConfig('database')['mongodb']
    return await this.initDB(
      dbConfig.account,
      dbConfig.pass,
      dbConfig.ip,
      dbConfig.port,
      dbConfig.dbname
    )
  }

  async createPlayer(id, openid, unionid, nickname, sex, headimgurl, account, pass, score) {
    var userInfoModel = this.mog.getModle('userinfo');
    var newPlayer = new userInfoModel();
    //用户信息
    newPlayer.id = id;
    newPlayer.openid = openid;
    newPlayer.unionid = unionid;
    newPlayer.nickname = nickname;
    newPlayer.sex = sex;
    newPlayer.headimgurl = headimgurl;
    newPlayer.account = account;
    newPlayer.pass = pass;
    newPlayer.score = score;

    newPlayer.loginTime = new Date();
    newPlayer.createTime = new Date();

    var info = await newPlayer.save().catch((err) => {
      info = null
    })
    return Promise.resolve(info)
  }

  async canLogin(account, pass, options = { account: 1, pass: 1, nickname: 1, headimgurl: 1, score: 1, sex: 1, id: 1 }) {
    var userInfoModel = this.mog.getModle('userinfo')
    var infos = await userInfoModel.findOne(
      { account: account, pass: pass }, options
    ).lean().catch(err => {
      infos = null
    })
    return Promise.resolve(infos)
  }

  async findPlayer(account, options) {
    var userInfoModel = this.mog.getModle('userinfo');
    var infos = await userInfoModel.findOne({ account: account }, options)
      .lean()
      .catch(err => {
        infos = null;
      });
    return Promise.resolve(infos)
  }

}

DataBaseManager.g_Instance = null;

module.exports = DataBaseManager
