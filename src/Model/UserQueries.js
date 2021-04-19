const conn = require('../../lib/mongoConn')();
const ObjectId = require("mongoose").Types.ObjectId;
const UserQueries = {};

const UsersModel = conn.model('Users', require('./Schema/Users'));
const UserQueryMetasModel = conn.model('UserQueryMetas', require('./Schema/UserQueryMetas'));
const UserQueriesModel = conn.model('UserQueries', require('./Schema/UserQueries'));
const EvidencesModel = conn.model('Evidence', require('./Schema/Evidences'));

/**
 * Gets UserQuery by it's _id
 * @param {Number|String} _id
 * @return {Promise} UserQuery
 * @public
 */
UserQueries.get = async (_id) => {
    let queries = await UserQueriesModel.aggregate([
        {
            $lookup: {
                from: "userquerymetas",
                localField: "_id",
                foreignField: "user_query_id",
                as: "metas"
            }
        },
        {
            $lookup: {
                from: "evidences",
                let: {"userQueryId": "$_id"},
                pipeline: [
                    { 
                        $match: {
                            $expr:{
                                $eq: ["$user_query_id", "$$userQueryId"]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "editor_id",
                            foreignField: "_id",
                            as: "editor"
                        }
                    }
                ],
                as: "evidences"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "editor_id",
                foreignField: "_id",
                as: "editor"
            }
        },
        {
            $match: {
                '_id': {
                    $eq: new ObjectId(_id)
                }
            }
        }
    ]);
    queries[0]['evidences'].forEach((e) => {
        e.editor = e.editor[0];
    });
    queries[0]['editor'] = queries[0]['editor'][0];
    return queries[0];
};

/**
 * Gets all UserQueries
 * @return {Promise} UserQueries
 * @public
 */
UserQueries.getAll = () => UserQueriesModel.aggregate([
    {
        $lookup: {
            from: "userquerymetas",
            localField: "_id",
            foreignField: "user_query_id",
            as: "metas"
        }
    },
    {
        $lookup: {
            from: "evidences",
            localField: "_id",
            foreignField: "user_query_id",
            as: "evidences"
        }
    }
]);

/**
 * Gets all UserQueries
 * @param {string[]} args
 * @return {Promise} UserQueries
 * @public
 */
UserQueries.findByMetas = async (args, status = null) => {
    // Metas Match REGEX
    const meta_expr = "(.*(" + args.join('|') + ").*)";
    let match = {
        'metas.value': {
            $regex: meta_expr
        }
    };
    if(status != null){
        if(Array.isArray(status) != true)
            status = [status]; 
        match.status = {
            $in: status
        };
    }
    let quer_queries = await UserQueriesModel.aggregate([
        {
            $lookup: {
                from: "userquerymetas",
                localField: "_id",
                foreignField: "user_query_id",
                as: "metas"
            }
        }
    ]).match(match);
    // SORT BY META MATCHES
    let countMetaMatch = (acc, curr)=> {
        return acc + (curr.value.match(meta_expr) != null ? 1 : 0);
    };
    return quer_queries.sort((a, b)=> {
        if(a.count_meta_match == undefined)
            a.count_meta_match = a.metas.reduce(countMetaMatch, 0);
        if(b.count_meta_match == undefined)
            b.count_meta_match = b.metas.reduce(countMetaMatch, 0);
        return b.count_meta_match - a.count_meta_match;
    });
};

/**
 * Creates a new UserQuery
 * @param {String} text
 * @param {String} metas
 * @param {String} ip_address
 * @param {String} hash
 * @param {'unrated'|'true'|'false'|'not assessable'} status
 * @return {Promise} User
 * @public
 */
UserQueries.create = async (text, metas, ip_address, user_agent, status = "new") => {
    let data = {
        'text': text,
        'client': {
            "ip_address": ip_address,
            "user_agent": user_agent
        },
        'status': status
    };
    if(status == null)
        delete data.status;
    let new_query;
    if(new_query = await UserQueriesModel.create(data)){
        let meta_promise = metas.map(meta => {
            console.log(meta);
            return UserQueryMetasModel.create({
                'user_query_id': new_query._id,
                'type': meta.type,
                'value': meta.value
            })
        });
        await Promise.all(meta_promise);
        return new_query;
    }
}
/**
 * Update UserQuery by it's  _id
 * @param {Number|String} _id
 * @param {{}} data
 * @return {Promise} UserQuery
 * @public
 */
UserQueries.update = (_id, data) => {
    return UserQueriesModel.updateOne({'_id': new ObjectId(_id)}, {
        $set: {...data, 'update_date': Date.now()}
    }
)};

/**
 * Get by status
 * @param {String} status
 * @return {Promise} UserQuery
 * @public
 */
UserQueries.getByStatus = (status) => UserQueriesModel.find({'status': status});

/**
 * Gets all confirmed or not confirmed UserQueries
 * @param {Boolean} flag
 * @return {Promise} UserQueries
 * @public
 */
UserQueries.getReviewed = () => UserQueriesModel.find({'status': {$nin: ['new', 'unrated']}}).sort({'create_date': 'desc'});

/**
 * Get by status
 * @param {String} status
 * @return {Promise} UserQuery
 * @public
 */
UserQueries.remove = (_id) => Promise.all([
    UserQueriesModel.deleteOne({'_id': ObjectId(_id)}),
    UserQueryMetasModel.deleteMany({'user_query_id': ObjectId(_id)}),
    EvidencesModel.deleteMany({'user_query_id': ObjectId(_id)})
]);

module.exports = UserQueries;