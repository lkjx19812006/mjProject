const Mongoose = require('mongoose')
Mongoose.Promise = global.Promise

class MongooseAsync {
  constructor(props) {
    this.models = new Map();
    this.db = null;
    this.connectUrl = null;
  }

  async connect(account, pass, ip, port, dbname) {
    return await new Promise((resolve, reject) => {
      //设置数据库服务器账号密码ip 端口号 用户名
      this.connectUrl = `mongodb://${account}:${pass}@${ip}:${port}/${dbname}`
      console.log('当前数据库服务器链接：' + this.connectUrl);
      Mongoose.connect(this.connectUrl);
      this.db = Mongoose.connection;
      console.log('数据库链接中...')
      this.db.on('connected', () => {
        resolve(true);
        console.log('数据库链接成功')
      })
      this.db.on('error', (err) => {
        resolve(false);
        this.connect(account, pass, ip, port, dbname);
        console.log('数据库链接错误' + err)
      })
      this.db.on('close', () => {
        this.connect(account, pass, ip, dbName);
        console.log('数据库关闭')
      });

    })

  }

  makeModel(name, modelJson) {//创建model
    var schema = new Mongoose.Schema(modelJson);
    var model = this.db.model(name, schema);
    this.models[name] = model;
    return model;
  }
  getModle(name) {//获取model
    return this.models[name];
  }

}

module.exports = MongooseAsync;