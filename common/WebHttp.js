const request = require('request');
const conf = require('../common/Config').instance();
const config = conf.getConfig('services')['webService']['hosts'][0];
const pathUrl = 'http://' + config.ip + ':' + config.port;

class WebHttp {
    //获取房间id
    static getRoomid(url) {
        url = pathUrl + url;
        return new Promise((resolve, reject) => {
            var body = ''
            request
                .post(url)
                .on('data', (data) => {
                    body += data;
                })
                .on('end', data => {
                    resolve(JSON.parse(body))
                })
                .on('error', (err) => {
                    reject(err)
                })
        })
    }

    //游戏登陆校验
    static gameLogin(url, account, pass) {
        url = pathUrl + url;
        return new Promise((resolve, reject) => {
            var body = ''
            request
                .post(url)
                .form({ account: account, pass: pass })
                .on('data', (data) => {
                    body += data;
                })
                .on('end', data => {
                    resolve(JSON.parse(body))
                })
                .on('error', (err) => {
                    reject(err)
                })
        })
    }

}

module.exports = WebHttp;


