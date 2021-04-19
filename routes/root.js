const router = require('express').Router();
const pushLog = require('../lib/pushLog');
const UserQueries = require('../src/Model/UserQueries');

router.get('/', async function(req, res) {
    let reviewed_user_queries = await UserQueries.getReviewed();
    res.ejsRender('home.ejs', {'reviewed_user_queries': reviewed_user_queries}, (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            console.error(err);
            pushLog(err, "rendering home");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.get('/logout', function(req, res){
    // TODO CREATE MESSAGE IN SESSION
    req.session.destroy((err)=>{
        if(err != null){
            pushLog(err, "Logout");
        }
        else
            res.newMessage('success', "signOut_message");
        res.redirect(302, '/');
    })
});

router.get('/signin', function(req, res) {
    // CHECK IF ALREADY SIGNED IN
    if(req.user != null){
        res.redirect(302, '/');
        return;
    }
    res.ejsRender('signin.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            console.error(err);
            pushLog(err, "signin");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.get('/signup', function(req, res) {
    // CHECK IF ALREADY SIGNED IN
    if(req.user != null){
        res.redirect(302, '/');
        return;
    }
    res.ejsRender('signup.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            pushLog(err, "signup");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.get('/debug', function(req, res) {
    // CHECK IF ALREADY SIGNED IN
    if(req.user == null || req.user.role != 'admin'){
        res.redirect(302, '/');
        return;
    }
    res.ejsRender('debug.ejs', (err, file) => {
        if(err == null){
            res.send(file);
        }
        else{
            pushLog(err, "debug");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.get('/about', async function(req, res) {
    res.ejsRender('about.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            console.error(err);
            pushLog(err, "rendering about");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.get('/privacy-policy', async function(req, res) {
    res.ejsRender('privacy-policy.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            console.error(err);
            pushLog(err, "rendering privacy policy");
            res.sendStatus(500);
        }
        res.end();
    });
});


module.exports = router;