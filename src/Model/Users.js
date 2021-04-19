const conn = require('../../lib/mongoConn')();
const ObjectId = require("mongoose").Types.ObjectId;
const Users = {};

const UsersModel = conn.model('Users', require('./Schema/Users'));

/**
 * Gets user by it's  unique_id
 * @param {Number|String} unique_id
 * @return {Promise} User
 * @public
 */
Users.get = (_id) => UsersModel.findOne({'_id': _id});

/**
 * Gets all users
 * @return {Promise} Users
 * @public
 */
Users.getAll = () => UsersModel.find({});

/**
 * Creates a new user
 * @param {String} first_name
 * @param {String} surname
 * @param {String} email
 * @param {String} hash
 * @param {'active'|'deactivated'|'unconfirmed'} status
 * @return {Promise} User
 * @public
 */
Users.create = (first_name, surname, email, hash, status) => UsersModel.create({
    'first_name': first_name,
    'surname': surname,
    'email': email,
    'hash': hash,
    'status': status
});

/**
 * Gets user by it's  unique_id
 * @param {Number|String} unique_id
 * @param {{}} data
 * @return {Promise} User
 * @public
 */
Users.update = (_id, data) => UsersModel.updateOne({'_id': ObjectId(_id)}, {
    $set: {...data, 'update_date': Date.now()}
});

/**
 * Get by email
 * @param {String} email
 * @return {Promise} User
 * @public
 */
Users.getByEmail = (email) => UsersModel.findOne({'email': email});

/**
 * Gets all active or not active users
 * @param {Boolean} flag
 * @return {Promise} User
 * @public
 */
Users.getActive = (flag = true) => UsersModel.findOne({'status': flag ? 'active' : 'deactivated'});

/**
 * Gets all confirmed or not confirmed users
 * @param {Boolean} flag
 * @return {Promise} User
 * @public
 */
Users.getConfirmed = (flag = true) => UsersModel.findOne({'status': flag ? {$ne: 'unconfirmed'} : 'unconfirmed'});


Users.confirmByHash = (hash) => UsersModel.findOne(({'status': 'unconfirmed', 'confirmation.hash': hash, 'confirmation.expire_date': {$gt: Date.now()}}).than((user)=>{
    Users.update({'_id': user._id}, {'status': 'confirmed', 'confirmation': []});
}));

module.exports = Users;