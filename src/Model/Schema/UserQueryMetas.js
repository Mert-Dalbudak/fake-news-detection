const {Schema} = require('mongoose');
const ObjectId = Schema.ObjectId;

module.exports = new Schema({
    user_query_id: {
        type: ObjectId,
        ref: "UserQueries",
        required: true
    },
    type: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    update_date: {type: Date},
    create_date: {
        type: Date, 
        default: Date.now
    }
});