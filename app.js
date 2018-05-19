//一些实例初始化
const conf = require('./common/Config').instance()
const ServiceManager = require('./server/ServiceManager').instance()

const asyncRun = async function () {
  //查看启动模式
  if (conf.mode === 'debug') {
    //单线程启动所有
    ServiceManager.startAllService()
  } else {
    // ServiceManager.startAllService()
    //启动子进程
    ServiceManager.startProcessService();//开启进程服务
  }

}
asyncRun();