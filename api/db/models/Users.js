const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    email: { 
        type: String, 
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: [
            Enum.USER_ROLES.ADMIN,
            Enum.USER_ROLES.CUSTOMER,
            Enum.USER_ROLES.SALES_MANAGER,
            Enum.USER_ROLES.PRODUCT_MANAGER,
            Enum.USER_ROLES.SUPPORT_AGENT
        ],
        default: Enum.USER_ROLES.CUSTOMER
    },
    first_name: { 
        type: String, 
        required: true 
    },
    last_name: { 
        type: String, 
        required: true 
    },
    phone_number: { 
        type: String 
    },
    taxID: {
        type: String,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },
    home_address: {
        type: String,
        required: function() {
            return this.role === Enum.USER_ROLES.CUSTOMER;
        }
    },
    is_active: { 
        type: Boolean, 
        default: true 
    },
    created_by: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    updated_by: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    language: { 
        type: String, 
        default: Enum.LANG.en 
    }
}, {
    versionKey: false,
    timestamps: true
});

// Index for faster queries
schema.index({ email: 1 });
schema.index({ role: 1 });
schema.index({ taxID: 1 });

class Users extends mongoose.Model {
    static findByEmail(email) {
        return this.findOne({ email: email.toLowerCase() });
    }

    static findByTaxID(taxID) {
        return this.findOne({ taxID: taxID });
    }

    static findByRole(role) {
        return this.find({ role });
    }

    static findActiveUsers() {
        return this.find({ is_active: true });
    }
}

schema.loadClass(Users);
module.exports = mongoose.model("Users", schema, "users");