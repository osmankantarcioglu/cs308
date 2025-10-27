const mongoose = require("mongoose");
const is = require("is_js");

const Enum = require("../../config/Enum");
const Error = require("../../lib/Error");

const schema = mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    is_active: { type: mongoose.Schema.Types.Boolean, defaultValue: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone_number: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId },
    updated_by: { type: mongoose.Schema.Types.ObjectId },
    language: { type: String, defaultValue: Enum.LANG.en }
}, {
    versionKey: false,
    timestamps: true
});

class Users extends mongoose.Model {

    
}

schema.loadClass(Users);
module.exports = mongoose.model("users", schema, "users");