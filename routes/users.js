const router = require('express').Router();
const bcrypt = require('bcrypt');
const pushLog = require('../lib/pushLog');
const Users = require('../src/Model/Users');
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
router.get('/', function(req, res) {
    res.redirect('/');
});

router.get('/confirm', async function(req, res) {
    let hash = req.query['hash'];
    if(hash == undefined){
        res.newMessage('error', 'error');
        res.redirect('/');
        return;
    }
    try{
        let user = await Users.confirmByHash(hash);
        console.log(user);
        res.newMessage('success', 'Email bestätigt');
    }catch(error){
        pushLog(error, "update user", "db");
        console.error(error);
        res.newMessage('error', 'error', "Irgendwas ist schief gelaufen");
    }
    res.redirect('/');
});

router.all('*', function(req, res, next) {
    if(req.user == null && req.path != "/confirm"){
        res.newMessage("error", "you_have_no_permission");
        res.redirect('/');
    }
    else{
        next();
    }
});

router.get('/settings', function(req, res) {
    res.ejsRender('user/settings.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            pushLog(err, "rendering settings");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.post('/settings', async function(req, res) {
    let form = req.body;
    let error = false;
    try{
        if(form.first_name.length == 0){
            res.newMessage('error', 'error', 'Vorname darf nicht leer sein');
            error = true;
        }
        if(form.surname.length == 0){
            res.newMessage('error', 'error', 'Nachname darf nicht leer sein');
            error = true;
        }
        if(!emailRegex.test(form.email)){
            res.newMessage('error', 'error', 'Email ist nicht valide');
            error = true;
        }
        if(error)
            res.redirect(req.originalUrl);
        await Users.update(req.user._id, {'first_name': form.first_name, 'surname': form.surname, 'email': form.email});
        res.newMessage('success', 'success');
    }catch(error){
        pushLog(error, "update user", "db");
        console.error(error);
        res.newMessage('error', 'error', "Irgendwas ist schief gelaufen");
    }
    res.redirect(req.originalUrl);
});

router.get('/change-password', function(req, res) {
    res.ejsRender('user/change-password.ejs', (err, file) => {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
        }
        else{
            pushLog(err, "rendering change-password");
            res.sendStatus(500);
        }
        res.end();
    });
});

router.post('/change-password', async function(req, res) {
    let form = req.body;
    // CHECK IF CURRENT PASS IS VALID
    const check_password = await bcrypt.compare(form.curr_password.toString(), req.user['hash']);
    if(check_password){
        if(form.new_password.length < 8){
            res.newMessage('error', "Kennwort zu kurz");
            res.redirect(req.originalUrl);
            return;
        }
        if(form.new_password_repeat != req.body.password_repeat){
            res.newMessage('error', "changePassword_mismatchSummary");
            res.redirect(req.originalUrl);
            return;
        }
        try{
            await Users.update(user._id, {'hash': form.first_name});
            res.newMessage('success', 'success');
        }catch(error){
            res.newMessage('error', 'error', "Irgendwas ist schief gelaufen");
        }
    }
    else {
        res.newMessage('error', 'error', "Passwort ist falsch");
    }
    res.redirect(req.originalUrl);
});

module.exports = router;