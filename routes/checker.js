const router = require('express').Router();
const pushLog = require('../lib/pushLog');
const RestApi = require('../lib/RestApi');
const Spacy = require('../lib/Spacy');
const UserQueries = require('../src/Model/UserQueries');

router.get('/', function(req, res) {
    res.ejsRender('user-queries/checker.ejs', (err, file) => {
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

router.post('/query', async (req, res) => {
    const user_text = req.body.value;
    let spacy;
    if(user_text.length == 0){
        res.newMessage('error', "error", "claimQueryIsEmpty");
        res.redirect("/checker");
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
    let new_query = UserQueries.create(user_text, metas, req.remoteAddressAnonym, req.headers['user-agent']);
    let entities = [...spacy.entities.map(e => e.value), ...spacy.lemma];
    let get_confirmed = await UserQueries.findByMetas(entities, ['true', 'false', 'unevaluable']);
    new_query = await new_query;
    res.ejsRender('user-queries/checker-results', {'query_id': new_query._id, 'reviewed_queries': get_confirmed}, (err, file)=> {
        if(err == null){
            res.send(file);
            res.end();
        }
        else{
            console.error(err);
            pushLog(err, "/checker/query", "request");
            res.sendStatus(500);
        }
    });
    res.end();
});

router.get('/query/:_id', async function(req, res){
    const query_id = req.params['_id'];
    let user_query = await UserQueries.get(query_id);
    
    res.ejsRender('user-queries/item.ejs', {'user_query': user_query}, function(err, file){
        if(err == null){
            res.send(file);
            res.end();
        }
        else{
            console.error(err);
            pushLog(err, "render item.ejs", "request");
            res.sendStatus(500);
        }
    });
});

router.get('/no-match/:_id', async (req, res)=>{
    const query_id = req.params['_id'];
    await UserQueries.update(query_id, {'status': "unrated"});
    let user_query = await UserQueries.get(query_id);
    console.log(user_query);
    let api_query_text = user_query.metas.reduce((acc, curr) => `${acc} ${curr.type != 'lemma' ? curr.value : ""}`, "").trim();
    console.log(api_query_text);
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
    res.ejsRender('user-queries/no-match.ejs', {'nyt': nyt_response.response.docs, 'zeit': zeit_response.matches, 'wiki': wiki_response, 'api_text': api_query_text, 'user_query': user_query}, (err, file)=> {
        if(err == null){
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

module.exports = router;