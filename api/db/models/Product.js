const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    model: {
        type: String
    },
    serial_number: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // Allow null values but ensure uniqueness when present
        set: v => {
            if (v === null || v === undefined) return v;
            const t = String(v).trim();
            return t.length ? t : undefined;
        }
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        default: function() {
            // Default cost is 50% of sale price
            return this.price * 0.5;
        },
        min: 0
    },
    warranty_status: {
        type: String
    },
    distributor: {
        type: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    images: [{
        type: String // URLs or paths to product images
    }],
    popularity_score: {
        type: Number,
        default: 0
    },
    view_count: {
        type: Number,
        default: 0
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

// Indexes for faster queries
schema.index({ name: 1 });
schema.index({ category: 1 });
schema.index({ price: 1 });
schema.index({ popularity_score: -1 });
// Note: serial_number index is automatically created by unique:true in schema

class Product extends mongoose.Model {
    static searchByNameOrDescription(query) {
        return this.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ],
            is_active: true
        });
    }

    static findByCategory(categoryId) {
        return this.find({ category: categoryId, is_active: true });
    }

    static updateStock(productId, quantity) {
        return this.findByIdAndUpdate(
            productId,
            { $inc: { quantity: -quantity } },
            { new: true }
        );
    }

    static addStock(productId, quantity) {
        return this.findByIdAndUpdate(
            productId,
            { $inc: { quantity: quantity } },
            { new: true }
        );
    }
}

schema.loadClass(Product);
module.exports = mongoose.model("Product", schema, "products");

