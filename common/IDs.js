//获取配置实例
const path = require('path')
const fs = require('fs')
const conf = require('./Config').instance()
const UnitTools = require('../utils/UnitTools')

class IDs {
  constructor(props) {
    this.config = conf.getConfig('ids');
    this.idsPath = path.join(__dirname, '../' + this.config.path);
    this.idsCountPath = path.join(__dirname, '../' + this.config.countpath);
    this.initIDs();
  }

  static instance() {
    if (IDs.g_Instance == null) {
      IDs.g_Instance = new IDs()
    }
    return IDs.g_Instance
  }

  //初始化IDs文件
  initIDs() {
    //需要创建
    if (this.config.create) {
      console.log('需要创建IDs文件')
      this.createIDsFile(this.config.from, this.config.to, this.idsPath, this.idsCountPath)
      return;
    }
    console.log('IDs文件已经存在')
  }

  //创建id文件
  createIDsFile(from, to, path, countPath) {
    //需要创建多少个 buffer
    var numCount = (to - from) + 1;
    var buffer = Buffer.alloc(4 * numCount);
    console.log('缓冲区创建完毕')
    //填充buffer
    for (var i = from; i <= to; i++) {
      var start = i - from;
      start = start * 4;
      buffer.writeUInt32LE(i, start);
    }
    console.log('缓冲区填充完毕')
    //交换buffer值 打乱
    for (var i = 0; i < numCount; i++) {
      var randomIndex = UnitTools.random(0, numCount - 1);
      var currentNum = buffer.readUInt32LE(i * 4);
      var changeNum = buffer.readUInt32LE(randomIndex * 4)

      buffer.writeInt32LE(changeNum, i * 4);
      buffer.writeInt32LE(currentNum, randomIndex * 4);
    }
    console.log('IDs文件顺序打乱完毕')
    try {
      //写入到文件
      fs.writeFileSync(path, buffer, { flag: 'w' });
      fs.writeFileSync(countPath, 0, { flag: 'w' });
      console.log('IDs文件写入完成')
    } catch (error) {
      console.log('IDs文件写入文件出错')
    }

  }

  async getID() {
    //支持高并发下获取ID
    var now = Date.now()
    this.countNum = parseInt(fs.readFileSync(this.idsCountPath))
    this.countNum++;
    fs.writeFileSync(this.idsCountPath, this.countNum);
    return new Promise((resolve, reject) => {
      console.log('当前用户ID编号：' + this.countNum)
      var startBufferIndex = this.countNum * 4;

      var stream = fs.createReadStream(this.idsPath, { start: startBufferIndex, end: startBufferIndex + 4, flags: "r" })

      var prePath = __dirname;
      stream.on("data", (dataBuffer) => {
        var id = dataBuffer.readUInt32LE(0);
        console.log('对应ID：' + id)
        resolve(id);
        console.log('程序执行完成用时' + (Date.now() - now))
      })
    })
  }

}

IDs.g_Instance = null;

module.exports = IDs;