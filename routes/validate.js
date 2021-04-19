const router = require('express').Router();
const pushLog = require('../lib/pushLog');
const RestApi = require('../lib/RestApi');
const UserQueries = require('../src/Model/UserQueries');
const Evidences = require('../src/Model/Evidences');
const Spacy = require('../lib/Spacy');

const allowed_roles = ['editor', 'admin'];

router.all('/*', function(req, res, next){
    if(req.user && allowed_roles.findIndex(e => e == req.user.role) > -1){
        next();
    }
    else{
        res.newMessage('warn', "you_have_no_permission");
        res.redirect('/');
    }
});

router.get('/', async function(req, res) {
    let unrated_queries = await UserQueries.getByStatus('unrated');
    console.log(unrated_queries);
    res.ejsRender('validate/dashboard.ejs', {'claims': unrated_queries}, (err, file) => {
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

router.get('/review/:_id', async function(req, res) {
    const query_id = req.params['_id'];
    let user_query = await UserQueries.get(query_id);
    console.log(user_query);
    let api_query_text = user_query.metas.reduce((acc, curr) => `${acc} ${curr.type != 'lemma' ? curr.value : ""}`, "").trim();
    const nyt = new RestApi('NYT', 'article', {'queries': {'q': api_query_text}});
    const zeit = new RestApi('Zeit', 'findContent', {'queries': {'q': api_query_text}});
    const wiki = new RestApi('wikipedia', 'search', {'queries': {'srsearch': api_query_text}});
    let nyt_response, zeit_response, wiki_response;
    try {
        nyt_response = await nyt.req();
        zeit_response = await zeit.req();
        wiki_response = await wiki.req();
    } catch (error) {
        console.log(error);
        pushLog(error, "API request", 'request');
        res.sendStatus(500);
        return;
    }
    if(wiki_response.error != undefined)
        wiki_response = [];
    else 
        wiki_response = wiki_response.query.search;
    res.ejsRender('validate/review.ejs', {'nyt': nyt_response.response.docs, 'zeit': zeit_response.matches, 'wiki': wiki_response, 'user_query': user_query, 'api_query_text': api_query_text}, (err, file)=> {
        if(err == null){
            res.clearCookie('msgs');
            res.send(file);
            res.end();
        }
        else{
            console.error(err);
            pushLog(err, "/checker/query", "request");
            res.sendStatus(500);
        }
    });
});

router.post('/review/:_id', async function(req, res) {
    if(req.body.rating == undefined){
        res.newMessage('error', "error", "Geben Sie eine Bewertung ab");
        res.redirect(req.originalUrl);
        return;
    }
    if(req.body['evidence-source'].length == 0 || (req.body['evidence-source'].length == 1 && req.body['evidence-source'][0] == "")){
        res.newMessage('error', "error", "Geben Sie mind. 1 Quelle an");
        res.redirect(req.originalUrl);
        return;
    }
    const query_id = req.params['_id'];
    let evidences = req.body['evidence-source'].filter(val => val);
    for(let i = 0; i < evidences.length; i++){
        Evidences.create(query_id, req.user._id, evidences[i]);
    }
    await UserQueries.update(query_id, {'status': req.body.rating, editor_id: req.user._id});
    res.newMessage('success', "success");
    res.redirect('/validate');
});

router.post('/self-review', async function(req, res) {
    const user_text = req.body.rumour;
    let spacy;
    if(user_text.length == 0){
        res.newMessage('error', "error", "claimQueryIsEmpty");
        res.redirect("/validate");
        return;
    }
    if(req.body.rating == undefined){
        res.newMessage('error', "error", "Geben Sie eine Bewertung ab");
        res.redirect(req.originalUrl);
        return;
    }
    if(req.body['source'].length == 0 || (req.body['source'].length == 1 && req.body['source'][0] == "")){
        res.newMessage('error', "error", "Geben Sie mind. 1 Quelle an");
        res.redirect(req.originalUrl);
        return;
    }
    try {
        spacy = await Spacy.query(user_text);
    } catch(error){
        console.log(error);
        pushLog(error, "Spacy parse", 'request');
        res.sendStatus(500);
        return;
    }
    let metas = [...spacy.entities, ...spacy.lemma.map(e => ({'type': "lemma", 'value': e}))];
    let new_query = await UserQueries.create(user_text, metas, req.remoteAddressAnonym, req.headers['user-agent']);
    let evidences = req.body['source'].filter(val => val);
    for(let i = 0; i < evidences.length; i++){
        Evidences.create(new_query._id, req.user._id, evidences[i]);
    }
    await UserQueries.update(new_query._id, {'status': req.body.rating, 'editor_id': req.user._id});
    res.newMessage('success', "success");
    res.redirect('/validate');
});

router.delete('/delete/:_id', async function(req, res){
    const query_id = req.params['_id'];
    try {
        await UserQueries.remove(query_id);
        res.send('success');
    } catch(error){
        pushLog(error, "Delete Query");
        console.error(error);
        res.send('operation failed');
    }
});

module.exports = router;