const conf = require('../common/Config').instance();
const DataBaseManager = require('../dbManager/DataBaseManager').instance()
const process = require('process')

//web服务相关
const path = require('path')
const express = require('express')
const app = express()
const bodyParser = require('body-parser');

//body参数转化中间件
app.use(bodyParser.urlencoded({ extended: false }))

//使用静态资源
app.use(express.static(path.join(__dirname, '../public')));

//处理跨域问题
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Access-Token");//允许设置的自定义请求头
  res.header("Access-Control-Expose-Headers", "*");
  next();
});


class webManager {
  constructor(serverConf) {
    if (!serverConf || !serverConf.port) {
      console.log(new Error('WebService 文件初始化错误 未传递port'))
      return;
    }
    this.init(serverConf)
  }
  async init(serverConf) {
    //初始化数据库
    var ok = await DataBaseManager.initDBFromServerConfig()
    if (!ok) {
      console.log(new Error('"数据库初始化错误！请检查'));
      return
    }

    //处理Api接口路由
    const user = require('../webApi/route/user');
    app.use('/user', user)

    app.listen(serverConf.port)
    console.log('web 服务开启成功，当前端口为：' + serverConf.ip + ':' + serverConf.port)
  }

}

//多进程启动 生产模式进行
if (process.argv[2] && conf.mode !== 'debug') {
  new webManager({ port: process.argv[2], ip: process.argv[3] });
}

module.exports = webManager