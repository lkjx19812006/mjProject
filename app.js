//一些实例初始化
const conf = require('./common/Config').instance()
const DataBaseManager = require('./dbManager/DataBaseManager').instance()
const ChildProcessManager = require('./server/ChildProcessManager').instance()

const path = require('path')
const express = require('express')
const app = express()
const bodyParser = require('body-parser');

//body参数转化中间件
app.use(bodyParser.urlencoded({ extended: false }))

//使用静态资源
app.use(express.static(path.join(__dirname, './public')));

//处理跨域问题
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
});



//处理Api接口路由
const user = require('./webApi/route/user');
app.use('/user', user)

const asyncRun = async function () {
  //初始化数据库
  var ok = await DataBaseManager.initDBFromServerConfig()
  if (!ok) {
    console.log('"数据库初始化错误！请检查！@Api.js');
    return
  }

  //全局唯一登陆服务IP端口
  var port;
  try {
    port = conf.getConfig('services')['webServer']['hosts'][0]['port']
  } catch (error) {

  }

  //主进程
  app.listen(port || 3000);
  //后续其他服务可在这里开启
  console.log('服务启动成功----主进程端口号：' + port || 3000)
  //查看启动模式
  if (conf.mode === 'debug') {
    //单线程启动所有
    ChildProcessManager.startAllService()
  } else {
    //启动子进程
    ChildProcessManager.startHallService();//开启大厅服务
  }
  // ChildProcessManager.startHallService();//开启大厅服务
}
asyncRun();