var express = require('express');
var router = express.Router();
const { getUsers } = require('../controllers/UserController');

/* GET users listing. */
router.get('/users', getUsers);

module.exports = router;
