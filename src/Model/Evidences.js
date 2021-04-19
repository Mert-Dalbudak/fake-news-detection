const conn = require('../../lib/mongoConn')();
const ObjectId = require("mongoose").Types.ObjectId;
const Evidences = {};

const UsersModel = conn.model('Users', require('./Schema/Users'));
const UserQueriesModel = conn.model('UserQueries', require('./Schema/UserQueries'));
const EvidencesModel = conn.model('Evidence', require('./Schema/Evidences'));

/**
 * Gets Evidence by it's _id
 * @param {String} _id
 * @return {Promise} Evidence
 * @public
 */
Evidences.get = async (_id) => EvidencesModel.findOne({'_id': ObjectId(_id)}).populate({
    'path': "userquery",
    'populate': {
        'path': 'userqueries'
    }
});

/**
 * Gets all Evidences
 * @return {Promise} Evidences
 * @public
 */
Evidences.getAll = () => EvidencesModel.find().populate({
    'path': "userquery",
    'populate': {
        'path': 'userqueries'
    }
});

/**
 * Gets all Evidences
 * @param {Number} user_query_id
 * @return {Promise} Evidences
 * @public
 */
Evidences.findByQuery = async (user_query_id) => EvidencesModel.find({'user_query_id': ObjectId(user_query_id)}).populate({
    'path': "userquery",
    'populate': {
        'path': 'userqueries'
    }
});

/**
 * Creates a new Evidence
 * @param {String} first_name
 * @param {String} surname
 * @param {String} email
 * @param {String} hash
 * @param {'unrated'|'true'|'false'|'not assessable'} status
 * @return {Promise} User
 * @public
 */
Evidences.create = async (user_query_id, editor_id, href, source = null, information = null) => {
    let data = {
        'user_query_id': user_query_id,
        'href': href,
        'editor_id': ObjectId(editor_id),
        'source': source,
        'information': information
    };
    return await EvidencesModel.create(data);
}

/**
 * Update Evidence by it's  _id
 * @param {String} _id
 * @param {{}} data
 * @return {Promise} Evidence
 * @public
 */
Evidences.update = (_id, data) => {
    return EvidencesModel.updateOne({'_id': new ObjectId(_id)}, {
        $set: {...data, 'update_date': Date.now()}
    }
)};

/**
 * Delete Evidence by it's  _id
 * @param {String} _id
 * @return {Void}
 * @public
 */
Evidences.delete = (_id) => EvidencesModel.deleteOne({'_id': new ObjectId(_id)});

module.exports = Evidences;