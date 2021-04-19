const {Schema} = require('mongoose');
const ObjectId = Schema.ObjectId;

module.exports = new Schema({
    sid: {
        type: String,
        unique:  true,
        required: true
    },
    user: {
        type: ObjectId,
        ref: "Users"
    },
    cookie: {
        expires: {
            type: Date
        },
        maxAge: {
            type: Number
        },
        originalMaxAge: {
            type: Number
        },
        secure: {
            type: Boolean,
            default: false
        },
        httpOnly: {
            type: Boolean
        },
        path: {
            type: String,
            default: "/"
        },
        sameSite: {
            type: String,
            default: "strict"
        }
    },
    update_date: {type: Date},
    create_date: {
        type: Date, 
        default: Date.now
    }
});