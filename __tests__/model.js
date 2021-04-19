const conn = require('../lib/mongoConn')();

const UsersModel = conn.model('Users', require('../src/Model/Schema/Users'));
const SessionsModel = conn.model('Sessions', require('../src/Model/Schema/Sessions'));

describe('Retrieving Sessions', () => {
    it('sould retrieve all sessions', async (done) => {
        const allSessions = await SessionsModel.find({}).populate({
            'path': "user",
            'populate': {
                'path': 'users'
            }
        });
        console.log(allSessions);
        expect(typeof allSessions).toEqual('object');
        done();
    }, 15000);
});

const Evidence = require('../src/Model/Evidences');

let new_evidence;

describe('Evidences', () => {
    it('sould create evidences', async (done) => {
        new_evidence = await Evidence.create("6068666e13c80dc5068fac5e", "https://dalbudak.de", "Trust Me");
        console.log(new_evidence);
        expect(typeof new_evidence).toEqual('object');
        done();
    }, 15000);
    it('sould retrieve all evidences', async (done) => {
        const all_evidence = await Evidence.getAll();
        console.log(all_evidence);
        expect(typeof all_evidence).toEqual('object');
        done();
    }, 15000);
    it('sould delete created evidences', async (done) => {
        //await Evidence.delete(new_evidence._id);
        done();
    }, 15000);
});