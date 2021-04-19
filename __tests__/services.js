const RestApi = require('../lib/RestApi');

describe('Testing API', () => {
    const api_query_text = "Deutschland Lockdown";
    it('should get die zeit articles', (done) => {
        const zeit = new RestApi('Zeit', 'findContent', {'queries': {'q': api_query_text}});
        zeit.req().then((data)=>{
            expect(Array.isArray(data.matches)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get nyt articles', (done) => {
        const nyt = new RestApi('NYT', 'article', {'queries': {'q': api_query_text}});
        nyt.req().then((data)=>{
            expect(Array.isArray(data.response.docs)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get wikipedia articles', (done) => {
        const wiki = new RestApi('wikipedia', 'search', {'queries': {'srsearch': api_query_text}});
        wiki.req().then((data)=>{
            expect(Array.isArray(data.query.search)).toEqual(true);
            done();
        });
    }, 10000);
});

describe('Testing API Zahlen', () => {
    const api_query_text = 123;
    it('should get die zeit articles', (done) => {
        const zeit = new RestApi('Zeit', 'findContent', {'queries': {'q': api_query_text}});
        zeit.req().then((data)=>{
            expect(Array.isArray(data.matches)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get nyt articles', (done) => {
        const nyt = new RestApi('NYT', 'article', {'queries': {'q': api_query_text}});
        nyt.req().then((data)=>{
            expect(Array.isArray(data.response.docs)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get wikipedia articles', (done) => {
        const wiki = new RestApi('wikipedia', 'search', {'queries': {'srsearch': api_query_text}});
        wiki.req().then((data)=>{
            expect(Array.isArray(data.query.search)).toEqual(true);
            done();
        });
    }, 10000);
});

describe('Testing API string zahl', () => {
    const api_query_text = "123";
    it('should get die zeit articles', (done) => {
        const zeit = new RestApi('Zeit', 'findContent', {'queries': {'q': api_query_text}});
        zeit.req().then((data)=>{
            expect(Array.isArray(data.matches)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get nyt articles', (done) => {
        const nyt = new RestApi('NYT', 'article', {'queries': {'q': api_query_text}});
        nyt.req().then((data)=>{
            expect(Array.isArray(data.response.docs)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get wikipedia articles', (done) => {
        const wiki = new RestApi('wikipedia', 'search', {'queries': {'srsearch': api_query_text}});
        wiki.req().then((data)=>{
            expect(Array.isArray(data.query.search)).toEqual(true);
            done();
        });
    }, 10000);
});

describe('Testing API leer', () => {
    const api_query_text = "";
    it('should get die zeit articles', (done) => {
        const zeit = new RestApi('Zeit', 'findContent', {'queries': {'q': api_query_text}});
        zeit.req().then((data)=>{
            expect(Array.isArray(data.matches)).toEqual(true);
            done();
        });
    }, 10000);
    it('should get nyt articles', (done) => {
        const nyt = new RestApi('NYT', 'article', {'queries': {'q': api_query_text}});
        nyt.req().then((data)=>{
            expect(Array.isArray(data.response.docs)).toEqual(true);
            done();
        });
    }, 10000);
    // FAILS
    it('should fail wikipedia articles', (done) => {
        const wiki = new RestApi('wikipedia', 'search', {'queries': {'srsearch': api_query_text}});
        wiki.req().then((data)=>{
            expect(Array.isArray(data.query.search)).toEqual(true);
            done();
        });
    }, 10000);
});