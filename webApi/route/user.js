const express = require('express');
const router = express.Router();
const UserHandler = require('../handle/user');
const handler = new UserHandler()

//获取参数body中间件
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()

router.post('/testLogin', jsonParser, handler.testLogin);
router.post('/getRoomid', jsonParser, handler.getRoomids);
router.post('/hallLogin', jsonParser, handler.hallLogin);
router.post('/gameLogin', jsonParser, handler.gameLogin);

module.exports = router;