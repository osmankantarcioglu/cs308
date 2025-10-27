const mongoose = require("mongoose");

const schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        added_at: {
            type: Date,
            default: Date.now
        },
        notified_discount: {
            type: Boolean,
            default: false
        }
    }]
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ user_id: 1 });
schema.index({ "products.product_id": 1 });

// Unique constraint on user_id to ensure one wishlist per user
schema.index({ user_id: 1 }, { unique: true });

class Wishlist extends mongoose.Model {
    static findByUser(userId) {
        return this.findOne({ user_id: userId });
    }

    static addProduct(userId, productId) {
        return this.findOneAndUpdate(
            { user_id: userId },
            {
                $push: {
                    products: {
                        product_id: productId,
                        added_at: new Date()
                    }
                }
            },
            { upsert: true, new: true }
        );
    }

    static removeProduct(userId, productId) {
        return this.findOneAndUpdate(
            { user_id: userId },
            {
                $pull: {
                    products: { product_id: productId }
                }
            },
            { new: true }
        );
    }

    static findByProduct(productId) {
        return this.find({
            "products.product_id": productId
        });
    }

    static markDiscountNotified(userId, productId) {
        return this.findOneAndUpdate(
            {
                user_id: userId,
                "products.product_id": productId
            },
            {
                $set: {
                    "products.$.notified_discount": true
                }
            },
            { new: true }
        );
    }
}

schema.loadClass(Wishlist);
module.exports = mongoose.model("Wishlist", schema, "wishlists");

