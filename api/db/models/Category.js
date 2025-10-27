const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    parent_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }
}, {
    versionKey: false,
    timestamps: true
});

// Index
schema.index({ name: 1 });

class Category extends mongoose.Model {
    static findActive() {
        return this.find({ is_active: true });
    }

    static findByName(name) {
        return this.findOne({ name, is_active: true });
    }
}

schema.loadClass(Category);
module.exports = mongoose.model("Category", schema, "categories");

