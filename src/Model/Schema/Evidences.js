const {Schema} = require('mongoose');
const ObjectId = Schema.ObjectId;

module.exports = new Schema({
    user_query_id: {
        type: ObjectId,
        ref: "UserQueries",
        required: true
    },
    editor_id: {
        type: ObjectId,
        ref: "Users",
        required: true
    },
    href: {
        type: String,
        required: true
    },
    source: {
        type: String
    },
    information: {
        type: String,
    },
    update_date: {type: Date},
    create_date: {
        type: Date, 
        default: Date.now
    }
});