const spacy = require('../lib/Spacy')

describe('Testing spacy', () => {
    it('should parse string', (done) => {
        spacy.on('ready', async() => {
            const doc = await spacy.query("Coronavirus ist eine Lüge!");
            console.log(doc);
            expect(typeof doc).toEqual('object');
            done();
        });
    }, 30000);
    it('should parse empty string', (done) => {
        spacy.on('ready', async() => {
            const doc = await spacy.query("");
            console.log(doc);
            expect(typeof doc).toEqual('object');
            done();
        });
    }, 30000);
    it('should parse number string', (done) => {
        spacy.on('ready', async() => {
            const doc = await spacy.query("123");
            console.log(doc);
            expect(typeof doc).toEqual('object');
            done();
        });
    }, 5000);

    it('should parse number', (done) => {
        spacy.on('ready', async() => {
            const doc = await spacy.query(123);
            console.log(doc);
            spacy.kill('SIGTERM');
            spacy.on('killed', ()=>{
                expect(typeof doc).toEqual('object');
            });
            done();
        });
    }, 5000);
});