var express = require('express');
var router = express.Router();
const chatRoom = require('../services/chat-room');

/* GET users listing. */
router.get('/users', (req, res) => {
  res.json({
    count: chatRoom.count(),
    users: chatRoom.listUsers()
  });
});

module.exports = router;
