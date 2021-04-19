const {Schema} = require('mongoose');
const ObjectId = Schema.ObjectId;

module.exports = new Schema({
    text: {
        type: String,
        required: true
    },
    client: {
        ip_address: {
            type: String,
            required: true
        },
        user_agent: {
            type: String,
            required: true
        },
        user_id: {
            type: ObjectId,
            ref: "Users"
        }
    },
    editor_id: {
        type: ObjectId,
        ref: "Users"
    },
    status: {
        type: String,
        enum: ["new", "unrated", "true", "false", "unevaluable"],
        default: "new"
    },
    update_date: {
        type: Date,
        default: null
    },
    create_date: {
        type: Date, 
        default: Date.now()
    }
});