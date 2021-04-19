const conn = require('../../lib/mongoConn')();

const UsersModel = conn.model('Users', require('./Schema/Users'));
const SessionsModel = conn.model('Sessions', require('./Schema/Sessions'));

module.exports = function (Store) {
    class SessionStore extends Store {
        constructor(options = {}){
            super(options);
        }
        /**
         * Get all sessions
         * @param {listSessionCallback} callback callback(error, sessions)
         */
        all(callback){
            SessionsModel.find({}).populate({
                'path': "user",
                'populate': {
                    'path': 'users'
                }
            }).then(function(data){
                callback(null, data);
            }).catch(function(error){
                callback(error, null);
            });
        }

        /**
         * 
         * @param {voidSessionCallback} callback 
         */
        destroy(sid, callback){
            console.trace("Delete: " + sid);
            SessionsModel.deleteOne({
                'sid': sid
            }).then(function(){
                callback(null);
            }).catch(function(error){
                callback(error);
            });
        }

        /**
         * 
         * @param {voidSessionCallback} callback 
         */
        clear(callback){
            console.trace("Clear");
            SessionsModel.remove({}).then(function(){
                callback(null);
            }).catch(function(error){
                callback(error);
            });
        }

        /**
         * 
         * @param {lengthSessionCallback} callback 
         */
        length(callback){
            SessionsModel.countDocuments({}, function(err,){
                callback(null);
            }).catch(function(error){
                callback(error);
            });
        }
        /**
         * Gets Sessions
         * @param {getSessionCallback} callback 
         */
        get(sid, callback){
            SessionsModel.findOne({'sid': sid}).populate({
                'path': "user",
                'populate': {
                    'path': 'users'
                }
            }).then((data)=>{
                callback(null, data);
            }).catch(error => {
                callback(error, null);
            });
        }

        /**
         * 
         * @param {voidSessionCallback} callback 
         */
        set(sid, session, callback){
            console.trace("Set: " + sid);
            console.log(session._doc);
            SessionsModel.create({
                'sid': sid,
                'user': session.user_id,
                'cookie': session.cookie 
            }).then(()=>{
                callback(null);
            }).catch(error => {
                callback(error);
            });
        }

        /**
         * 
         * @param {voidSessionCallback} callback 
         */
        touch(sid, session, callback){
            console.log("Touch: " + sid);
            SessionsModel.updateOne({'sid': sid},{
                $set: {
                    'cookie': session.cookie,
                    'update_date': Date.now
                }
            }).then(()=>{
                callback(null);
            }).catch(error => {
                callback(error);
            });
        }
    };
    return new SessionStore();
}


/**
 * List Session Function
 * @callback listSessionCallback
 * @param {*} error
 * @param {Array} sessions
*/
/**
 * Void Session Function
 * @callback voidSessionCallback
 * @param {*} error
*/
/**
 * Length Session Function
 * @callback lengthSessionCallback
 * @param {*} error
 * @param {number} len
*/
/**
 * Get Session Function
 * @callback getSessionCallback
 * @param {*} error
 * @param {Object} session
*/