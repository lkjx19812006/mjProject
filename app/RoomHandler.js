//每创建一个房间 都生成一个对应的房间管理对象 主要控制该房间的管理流程
const Logic = require('./Logic')
class RoomHandler {
    constructor(roomId) {
        this.inte = setInterval(this.update.bind(this), 1000);
        this.Logic = new Logic(roomId)
    }

    update() {
        this.Logic.update()
    }
}

module.exports = RoomHandler