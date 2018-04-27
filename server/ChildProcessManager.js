const conf = require('../common/Config').instance()
const path = require('path')
const fork = require('child_process').fork;

class ChildProcessManager {
  constructor() {
    this.HallServices = [];//大厅服务列表
    this.GameServices = [];//游戏服务列表
    this.HallConf = conf.getConfig('services')['HallService']['hosts'];
    this.GameConf = conf.getConfig('services')['GameService']['hosts'];
  }

  static instance() {
    if (ChildProcessManager.g_Instance == null) {
      ChildProcessManager.g_Instance = new ChildProcessManager()
    }
    return ChildProcessManager.g_Instance
  }
  //开启大厅服务
  startHallService() {
    this.HallConf.forEach((item, index) => {
      this.HallServices.push(fork(path.join(__dirname, './HallService.js'), [item.port, item.id, item.custom]));
      console.log('子进程大厅服务启动成功:' + item.ip + ":" + item.port)
      //监听进程消息
      this.HallServices[index].on('message', (msg) => {
        if (msg.cmd && msg.cmd === 'client connect') {
          console.log('有用户加入')
        }
      })

    });

  }
  //开启游戏服务
  startGameService() {

  }

}
ChildProcessManager.g_Instance = null;
module.exports = ChildProcessManager