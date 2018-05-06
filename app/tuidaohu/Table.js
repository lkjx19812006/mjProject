
var Room = require('../share/Room')//房间逻辑
var Logic = require('./Logic')//实际逻辑
class Table {
    constructor(playerId, tableId, custom) {
        this.createId = playerId;
        this.tableId = tableId
        this.custom = custom

        this.room = new Room(tableId, 4, null);
        this.logic = new Logic()
    }

    inPos(playerId, pos) {//进入座位 谁进入座位 进入哪个座位

    }

}

module.exports = Table;