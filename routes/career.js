const router = require('express').Router();
const pushLog = require('../lib/pushLog');

router.get('/', function(req, res) {
    res.ejsRender('career.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            pushLog(err, "rendering home");
            res.sendStatus(500);
        }
        res.end();
    });
});

module.exports = router;