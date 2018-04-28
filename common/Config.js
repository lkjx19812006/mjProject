const path = require('path')

//根据配置文件读取不同的serveconf 的json文件
const config = require(path.join(__dirname, '../modeConfig.json'))

class Config {
  constructor(props) {
    this.mode = config.mode;
    if (this.mode === 'debug') {
      console.log('配置文件读取当前模式----调试模式----')
      this.config = require(path.join(__dirname, '../serverconfdebug.json'))
    } else {
      console.log('配置文件读取当前模式----生产模式----')
      this.config = require(path.join(__dirname, '../serverconf.json'))
    }
  }
  static instance() {
    if (Config.g_Instance == null) {
      Config.g_Instance = new Config()
    }
    return Config.g_Instance
  }

  getConfig(keyName) {
    return this.config[keyName] || null;
  }
}

//设置全局单例模式
Config.g_Instance = null;

module.exports = Config
