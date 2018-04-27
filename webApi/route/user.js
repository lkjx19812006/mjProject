const express = require('express');
const router = express.Router();
const UserHandler = require('../handle/user');
const handler = new UserHandler()

//获取参数body中间件
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()

router.post('/testLogin', jsonParser, handler.testLogin);

module.exports = router;