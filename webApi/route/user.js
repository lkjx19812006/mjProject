const express = require('express');
const router = express.Router();
const UserHandler = require('../handle/user');
const handler = new UserHandler()

//获取参数body中间件
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()

router.post('/testLogin', jsonParser, handler.testLogin);
router.get('/getRoomid', jsonParser, handler.getRoomids);

module.exports = router;