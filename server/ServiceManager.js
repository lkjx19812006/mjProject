const conf = require('../common/Config').instance()
const path = require('path')
const fork = require('child_process').fork
const UnitTools = require('../utils/UnitTools')

const HallService = require('./HallService')

class ServiceManager {
  constructor() {
    //实例化处理启动所有服务
    this.conf = conf.getConfig('services');

    //获取redis 服务的端口号和ip zhi
    this.redisConf = conf.getConfig('redisCatch');
  }

  static instance() {
    if (ServiceManager.g_Instance == null) {
      ServiceManager.g_Instance = new ServiceManager()
    }
    return ServiceManager.g_Instance
  }

  //单线程启动所有服务 主要是本地开发调试
  startAllService() {
    for (var key in this.conf) {
      try {
        //引入服务文件
        var service = require(`./${key}.js`);
        //获取服务参数
        var sers = this.conf[key]['hosts'];
        sers.forEach((item, index) => {
          //循环开启服务
          service(item, this.redisConf)
        })
      } catch (error) {
        console.log(new Error(`当前${key}服务的入口文件不存在 请在server文件下创建`))
      }

    }
  }


  //开启大厅服务
  startProcessService() {
    for (var key in this.conf) {
      try {
        var sers = this.conf[key]['hosts'];
        sers.forEach((item, index) => {
          //循环开启服务
          fork(path.join(__dirname, `./${key}.js`), [item.port, item.id, item.custom]);
          console.log(`子进程/${key}启动成功:` + item.ip + ":" + item.port)
        })
      } catch (error) {
        console.log(new Error(`当前${key}服务的入口文件不存在 请在server文件下创建`))
      }
    }

    // this.HallConf.forEach((item, index) => {
    //   this.HallServices.push(fork(path.join(__dirname, './HallService.js'), [item.port, item.id, item.custom]));
    //   console.log('子进程大厅服务启动成功:' + item.ip + ":" + item.port)
    //   //监听进程消息
    //   this.HallServices[index].on('message', (msg) => {
    //     if (msg.cmd && msg.cmd === 'client connect') {
    //       console.log('有用户加入')
    //     }
    //   })

    // });

  }

}
ServiceManager.g_Instance = null;
module.exports = ServiceManager