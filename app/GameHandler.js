const Redis = require('ioredis')//用作消息订阅和分发
const RedisManager = require('../common/RedisManager')//房间信息操作

class GameHandler {
    constructor(socket, io, sub, pub) {
        this.io = io;
        this.socket = socket;
        this.sub = sub;
        this.pub = pub;
        this.redis = new RedisManager();
        this.init()
    }
    init() {
        //注册事件
        this.socket.on('joinRoom', this.joinRoom.bind(this))
    }

    async joinRoom(roomId, playerInfo, cb) {
        if (!roomId || !playerInfo) {
            cb && cb({ ok: false, suc: false })
            return
        }
        //校验坐位人数 限制一个房间四个人
        var playerNum = await this.redis.getRoomPlayerNum(roomId);
        if (playerNum >= 4) {
            cb && cb({ ok: true, suc: false, msg: '当前房间人数已满，请换个房间' })
            return;
        }
        //更新房间信息
        await this.redis.joinRoom(roomId, playerInfo);
        console.log('加入房间成功')
        this.socket.join(roomId)
        //订阅当前房间
        this.sub.subscribe(roomId);

        var newRoomInfo = await this.redis.getRoomInfo(roomId)
        cb && cb({ ok: true, suc: true, data: newRoomInfo });
        //广播用户加入消息
        this.pub.publish(roomId, JSON.stringify({
            "event": 'joinRoom',
            "data": newRoomInfo
        }));
    }
}

module.exports = GameHandler;