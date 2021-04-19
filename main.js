require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV;
const DOMAIN = process.env.DOMAIN;
const PROXY = process.env.PROXY == "true";
const PORT = process.env.PORT;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE) || false;


const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const fileUpload = require('express-fileupload');
const bcrypt = require('bcrypt');
const ejsRender = require('./lib/ejsRender');
const RestApi = require('./lib/RestApi');
const pushLog = require('./lib/pushLog');
const Users = require('./src/Model/Users');
const SendMail = require('./lib/SendMail');


const ROOT_DIR = __dirname;
const ROUTES_PATH = ROOT_DIR + "/routes/";
const STRINGS_PATH = ROOT_DIR + "/strings/";
const NAV_SCHEMA = require('./config/nav-schema');
const ALLOWED_LANGUAGES = require('./config/app').languages;
const SUPPORTED_LANGUAGES = fs.readdirSync(STRINGS_PATH).map(e => path.parse(e).name);
const FILE_NAME_LENGTH = 32;
const COOKIE_OPTIONS = {
    'path': "/",
    'signed': true,
    'httpOnly': true,
    'secure': NODE_ENV == "production",
    'sameSite': "strict"
};
const SESSION_OPTIONS = {
    'name': "usid",
    'resave': false,
    'saveUninitialized': false,
    'rolling': false,
    'secret': SESSION_SECRET,
    'proxy': PROXY,
    'cookie': {
        'path': "/",
        //'maxAge': SESSION_MAX_AGE,
        'httpOnly': true, 
        'secure': NODE_ENV == "production",
        'domain': DOMAIN,
        'sameSite': "strict"
    },
    'store': require('./src/Model/Sessions')(session.Store)
};
const CSRF_OPTIONS = { cookie: true };

const app = express();

/**
 * Gets the first accepted language
 * @param {string} remote_lang Language
 * @return {Object}
 * @public
 */
function acceptedLanguage(remote_lang){
    remote_lang = remote_lang.toLowerCase();
    const _default = ALLOWED_LANGUAGES.find(allowed => SUPPORTED_LANGUAGES.find(available => available.toLowerCase() == allowed.toLowerCase()));
    try{
        remote_lang = remote_lang.split(',').map(s => s.substr(0, 2));
        for(let i = 0; i < remote_lang.length; i++){
            const lang = ALLOWED_LANGUAGES.find(e => e.substr(0, 2).toLowerCase() == remote_lang[i]);
            if(lang != undefined)
                return lang;
        }
        pushLog(`Remote's accepted language is not allowed or not supported.`, 'Remote', 'request');
    }catch {
        pushLog(`Cannot understand remote's accepted language.`, 'Remote', 'request');
    }
    pushLog(`Setting ${_default} as language.`, 'Remote', 'request');
    return _default;
}

app.use(express.static(ROOT_DIR + '/public/static'));

app.use(express.urlencoded({
    extended: true
}));

// USE COOKIE-PARSER MIDDLEWARE
app.use(cookieParser(COOKIE_SECRET));
// USE CSRF MIDDLEWARE
app.use(csrf(CSRF_OPTIONS));
app.use(function(err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    // handle CSRF token errors here
    res.sendStatus(403);
    res.end();
});
// USE SESSION MIDDLEWARE
app.use(session(SESSION_OPTIONS));

/////////// CUSTOM MIDDLEWARE ///////////

app.use(async function(req, res, next){
    //////////// SET LANGUAGE ////////////

    req.language = req.signedCookies['lang'] || acceptedLanguage(req.headers['accept-language'] || "");

    //////////// SET LANGUAGE ////////////


    ////////////// MESSAGES //////////////

    req.messages = [];
    if(req.signedCookies['msgs'] != undefined){
        try{
            req.messages = JSON.parse(req.signedCookies['msgs']);
            if(Array.isArray(req.messages) == false)
                pushLog("Cannot understand messages", "Parse Messages")
        }
        catch(error){
            pushLog(error);
            req.messages = [];
        }
    }
    /**
     * Create a new message which will be shown when a new page will be rendered
     * @param {'success'|'warn'|'error'} type Message type
     * @param {string} subject Subject
     * @param {string} text Detailed message
     * @returns {void} Void, returns undefined
     * @overwrite
    */
    res.newMessage = function(type, subject, text = ""){
        req.messages.push({'type': type, 'subject': subject, 'text': text});
        // maxAge 5min: 5(min) * 60(sec) * 1000(millisec.) = 300000
        res.cookie('msgs', JSON.stringify(req.messages), {...COOKIE_OPTIONS, 'maxAge': 300000});
    };

    ////////////// MESSAGES //////////////

    /////// VALIDATE LOGIN STATUS ///////
    req.user = null;
    req.check_user_status = new Promise((resolve, reject)=> {

        if(req.session != undefined){
            if(req.session.user != undefined){
                console.log(req.session.user);
                req.user = {...req.session.user._doc}; // COPY DATA RATHER THEN REFERENCE
                console.log(req.user);
                resolve();
            }
            else
                reject();
        }
        else
            reject();
    });
    /////// VALIDATE LOGIN STATUS ///////
    
    next();
});


/////////// UPLOAD HANDLER ///////////

app.use(fileUpload({
    'useTempFiles' : true,
    'tempFileDir': ROOT_DIR + "/temp/upload/",
    'limits': { 
        'fileSize': 50 * 1024 * 1024    // 50Mbyte
    },
    'preserveExtension': true,
    'abortOnLimit': true
}));

/////////// UPLOAD HANDLER ///////////


///////////// EJS RENDER /////////////

app.use(ejsRender({
    'template_path': ROOT_DIR + "/public/template/layout", 
    'dictionary_path': ROOT_DIR + "/strings", 
    'default_dict': "root"
}));

///////////// EJS RENDER /////////////


/////////////// ROUTER ///////////////

app.all('/*', async (req, res, next) => {
    req.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // IPv4
    if(req.remoteAddress.indexOf(':') == -1)
        req.remoteAddressAnonym = req.remoteAddress.substring(0, req.remoteAddress.lastIndexOf('.'));
    // IPv6
    else
        req.remoteAddressAnonym = req.remoteAddress.substr(0, 9);
    pushLog(`${req.method}: ${req.url} from: ${req.remoteAddressAnonym}`, "Incoming", "request");
    req.nav_schema = NAV_SCHEMA;

    req.ejs_data = {};
    req.ejs_options = {};

    req.check_user_status.then(() => {
        // RULES FOR LOGGED IN USERS HERE
        pushLog("Logged in", "User Status", 'request');
        // TODO: CHECK USER PERMISSION AND REDIRECT TO / IF NO PERMISSION
        res.nav_schema = NAV_SCHEMA.filter((e) => {
            if(Array.isArray(e.permission))
                return e.permission.find(role => req.user.role == role);
            return true;
        });
        next();
    }, ()=> {
        // RULES FOR NOT LOGGED IN USERS HERE
        pushLog("Not logged in", "User Status", 'request');
        res.nav_schema = NAV_SCHEMA.filter((e) => e.permission == undefined);
        next();
    });
});

app.get('/lang/*', function(req, res){
    let lang = req.params[0];
    if(lang){
        lang = ALLOWED_LANGUAGES.find(e => e == lang.replace('/', '')) || ALLOWED_LANGUAGES[0];
        res.cookie('lang', lang, COOKIE_OPTIONS);
        res.redirect(302, req.query['redirect'] || '/');
    }
    else
        res.redirect('/');
});

app.post('/signin', async function(req, res) {
    // CHECK IF ALREADY SIGNED IN
    if(req.user != null){
        res.redirect(302, '/');
    }
    else {
        const user = await Users.getByEmail(req.body.email);
        if(user){
            console.log(user);
            const check_password = await bcrypt.compare(req.body.password.toString(), user['hash']);
            if(check_password){
                req.session.user_id = user['_id'];
                res.redirect(302, '/');
            }
            else {
                res.newMessage('error', "signIn_loginFailedMessage");
                res.redirect(302, '/');
            }
        }
        else{
            res.newMessage('error', "signIn_loginFailedMessage");
            res.redirect(302, '/');
        }
    }
});

app.post('/signup', function(req, res) {
    // CHECK IF ALREADY SIGNED IN
    if(req.user != null){
        res.redirect(302, '/');
        return;
    }
    if(req.body.password.length < 8){
        res.newMessage('error', "Kennwort zu kurz");
        res.redirect(req.originalUrl);
        return;
    }
    if(req.body.password != req.body.password_repeat){
        res.newMessage('error', "changePassword_mismatchSummary");
        res.redirect(req.originalUrl);
        return;
    }
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    const hash = bcrypt.hashSync(req.body.password, salt);
    Users.create(req.body.first_name, req.body.surname, req.body.email, hash).then(function(new_user){
        pushLog(`Users successfuly created, ID(${new_user._id})`, "SignUp", 'db');
        res.newMessage("success", "signUpSuccessTitle", "signUpSuccessText");
        // SEND CONFIRMATION MAIL
        new SendMail('default', new_user.email, "Bestätige deine E-Mail", `Hallo,\n klicke hier um deine Mail zu bestätigen: https://${DOMAIN}/users/confirm?hash=${encodeURIComponent(new_user.confirmation.hash)}`, (flag)=>{
            if(flag)
                pushLog(`Confirmation Email send to ${new_user.email}`);
            else
                pushLog(`Confirmation Email couldn't be send to ${new_user.email}`);
        });
        res.redirect(302, '/');
    }).catch(function(err){
        pushLog(err, 'Insert new User', 'db');
        res.newMessage('error', "error_pageTitle")
        res.redirect('/')
    });
});


// LOAD ALL ROUTERS
fs.readdirSync(ROUTES_PATH).forEach(function(filename) {
    const route = filename == "root.js" ? '/' : `/${path.parse(filename).name}`;
    app.use(route, require(ROUTES_PATH + filename));
},);

// 404 HANDLER
app.all('/*', function(req, res){
    res.statusCode = 404;
    res.ejsRender('404.ejs', {}, {}, function(err, file){
        if(err == null){
            res.send(file);
            res.end();
        }
        else {
            console.error(err);
            pushLog(err, "rendering 404 page", "request");
            res.redirect('/');
        }
    }, "error");
});

/////////////// ROUTER ///////////////


app.listen(PORT, () => pushLog('Application running on port ' + PORT, "Server start"));