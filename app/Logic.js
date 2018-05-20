const RedisManager = require('../common/RedisManager')//房间信息操作
const StaM = require("../common/StateManger.js");
const Majiang = require("./Majiang").Majiang;
const UnitTools = require("../utils/UnitTools");
const conf = require('../common/Config').instance()
const redisConf = conf.getConfig('redisCatch')
const Redis = require('ioredis')//用作消息订阅和分发
class Logic {
    constructor(roomId) {
        this.staM = new StaM();
        this.redis = new RedisManager();
        this.roomId = roomId;

        this.washCards = null;//洗完后的牌
        this.posCount = 4;//玩家座位数量
        this.socket = null;
        this.io = null;

        this.handCards = new Array(this.posCount);//牌型数量表
        this.rowHandCards = new Array(this.posCount);//手里原始牌数组
        for (var i = 0; i < this.posCount; i++) {
            var a = this.handCards[i] = new Array(34);
            a.fill(0)
            a = this.rowHandCards[i] = new Array(14);
            a.fill(0)
        }

        this.frames = [];//历史消息

        this.staM.registerState(1, this.waitingP.bind(this));//1表示等待
        this.staM.registerState(2, this.washPTest.bind(this));//2表示洗牌
        this.staM.registerState(3, this.hitP.bind(this));//3表示出牌等待
        this.staM.registerState(4, this.actionP.bind(this));//4表示动作等待
        this.staM.changeToState(1);

        this.pub = new Redis(redisConf.port, redisConf.ip)
    }
    update() {
        this.staM.update();
    }

    //遍历每次位置
    eachPos(cb) {
        for (var i = 0; i < this.posCount; i++) {
            cb(i)
        }
    }

    //获取SocketId 通过位置
    async getSocketIdWidthPos(pos) {
        //当前房间保存房间玩家信息
        var roomInfo = await this.redis.getRoomInfo(this.roomId);
        var rooms = (roomInfo && roomInfo.rooms) || []
        var socketId = (rooms[pos] && rooms[pos].socketId) || null;
        return Promise.resolve(socketId);
    }

    //特殊消息 发送给某个座位的玩家
    sendSpecialAndSave(pos, eventName, data) {
        this.sendMessageWidthPos(pos, eventName, data);
        this.frames.push({ pos: pos, eventName: eventName, data: data })
    }

    //发送消息通过座位
    async sendMessageWidthPos(pos, eventName, data) {
        var socketId = await this.getSocketIdWidthPos(pos);
        this.pub.publish(this.roomId, JSON.stringify({
            "socketId": socketId,
            "event": eventName,
            "data": data
        }));
    }

    //群发消息
    sendMessageAll(eventName, data) {
        this.pub.publish(this.roomId, JSON.stringify({
            "event": eventName,
            "data": data
        }));
    }


    async waitingP() {
        //查看当前是人数是否已经满了，如果满了进行下一步
        var nowPlayerNum = await this.redis.getRoomPlayerNum(this.roomId);
        console.log(nowPlayerNum)
        if (nowPlayerNum >= 4) {
            this.staM.changeToState(2);
            console.log('房间' + this.roomId + ":准备完成进入洗牌阶段");
            return;
        }
        console.log('等待玩家加入')
    }
    washPTest() {
        console.log('进入洗牌阶段了')
        this.washCards = Majiang.cards.concat()
        UnitTools.washArray(this.washCards);
        console.log('洗完后的牌:%o', this.washCards)
        for (var i = 0; i < 54; i += 16) {//发三轮牌
            this.eachPos((pos) => {
                var startIndex = i + pos * 4;//摸牌的索引
                var handStartIndex = i / 4;//手里牌的索引
                for (var j = 0; j < 4; j++) {
                    var cardIndex = this.rowHandCards[pos][handStartIndex + j] = this.washCards[startIndex + j]
                    var tIndex = Majiang.tIndex(cardIndex);
                    this.handCards[pos][tIndex] += 1;
                }
            })
        }
        console.log('当前手里的牌:%o', this.rowHandCards)
        console.log('牌型:%o', this.handCards)

        //广播消息
        this.eachPos((pos) => {
            var cards13 = this.rowHandCards[pos].slice(0, 13);
            this.sendSpecialAndSave(pos, 'startCard', cards13)
        })
        
        //进入下一个阶段
        this.staM.changeToState(3);

    }
    hitP() {
        console.log('进入出牌等待阶段')
    }
    actionP() {
        console.log('动作等待')
    }
}

Logic.HandAction = {
    Peng: 1,
    AnGang: 2,
    GuoluGang: 3,
    MingGang: 4
}
module.exports = Logic;