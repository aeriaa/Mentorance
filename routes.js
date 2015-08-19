var router = require('express').Router();
var main   = require('./controllers/main');

router.get('/', main.root);

module.exports = router;