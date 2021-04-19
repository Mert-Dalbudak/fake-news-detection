const {Schema} = require('mongoose');
const bcrypt = require('bcrypt');

// EXPIRE DATE NOW + 1 DAY

const EXPIRE =  24 * 60 * 60 * 1000;
const SALT_ROUNDS = 5;

module.exports = new Schema({
    first_name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        match: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
        required: true,
        unique: true
    },
    hash: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "deactivated", "unconfirmed"],
        default: "unconfirmed"
    },
    role: {
        type: String,
        enum: ["user", "editor", "admin"],
        default: "user"
    },
    confirmation: {
        hash: {
            type: String,
            default: function() { 
                return bcrypt.hashSync(this.email, bcrypt.genSaltSync(SALT_ROUNDS));
            }
        },
        expire_date: {
            type: Date,
            default: ()=> new Date(+new Date() + EXPIRE)
        }
    },
    update_date: {
        type: Date
    },
    create_date: {
        type: Date, 
        default: Date.now
    }
});