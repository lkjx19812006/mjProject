const conf = require("./Config").instance();
const ConsistentHash = require('consistent-hash');//一致性hash 负载均衡

class ServerBlance {
  constructor() {
    this.hrs = {};
    this.initFromServerConf();
  }
  static instance() {
    if (ServerBlance.g_Instance === null) {
      ServerBlance.g_Instance = new ServerBlance();
    }
    return ServerBlance.g_Instance;
  }
  initFromServerConf() {
    var confs = conf.getConfig('serverblance');
    for (var serviceName in confs) {
      var ips = confs[serviceName];
      this.addIP(serviceName, ips);
    }
  }

  addIP(serviceName, ips) {
    if (typeof this.hrs[serviceName] === "undefined") {
      var hr = new ConsistentHash();
      ips.forEach(item => {
        hr.add(item)
      })
      this.hrs[serviceName] = hr
    }
  }

  getIp(serviceName, id) {//后期使用的是微信，所以，实际到时候这里传递的是微信登录后的uuid
    var hr = this.hrs[serviceName];
    return hr.get(id);
  }
}

ServerBlance.g_Instance = null;

module.exports = ServerBlance;