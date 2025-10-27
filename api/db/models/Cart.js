const mongoose = require("mongoose");

const schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    session_id: {
        type: String // For guest users
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price_at_time: {
            type: Number,
            required: true
        }
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false,
    timestamps: true
});

// Index for faster queries
schema.index({ user_id: 1 });
schema.index({ session_id: 1 });

class Cart extends mongoose.Model {
    static findByUser(userId) {
        return this.findOne({ user_id: userId, is_active: true });
    }

    static findBySession(sessionId) {
        return this.findOne({ session_id: sessionId, is_active: true });
    }

    static addItemToCart(userId, productId, quantity, price) {
        return this.findOneAndUpdate(
            { user_id: userId, is_active: true },
            {
                $push: {
                    items: {
                        product_id: productId,
                        quantity: quantity,
                        price_at_time: price
                    }
                }
            },
            { upsert: true, new: true }
        );
    }

    static removeItemFromCart(userId, productId) {
        return this.findOneAndUpdate(
            { user_id: userId, is_active: true },
            {
                $pull: {
                    items: { product_id: productId }
                }
            },
            { new: true }
        );
    }

    static clearCart(userId) {
        return this.findOneAndUpdate(
            { user_id: userId, is_active: true },
            { is_active: false },
            { new: true }
        );
    }
}

schema.loadClass(Cart);
module.exports = mongoose.model("Cart", schema, "carts");

