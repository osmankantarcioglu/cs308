const mongoose = require("mongoose");

const schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
        // required: false - can be null for guest users
    },
    session_id: {
        type: String, // For guest users
        required: true
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

    static addItemToCart(sessionId, userId, productId, quantity, price) {
        const query = userId 
            ? { user_id: userId, is_active: true }
            : { session_id: sessionId, is_active: true };
        
        const update = {
            $push: {
                items: {
                    product_id: productId,
                    quantity: quantity,
                    price_at_time: price
                }
            },
            ...(userId ? { user_id: userId } : { session_id: sessionId }),
            is_active: true  // Ensure is_active is set for new carts
        };
        
        return this.findOneAndUpdate(
            query,
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    static updateItemQuantity(sessionId, userId, productId, quantity) {
        const query = userId 
            ? { user_id: userId, is_active: true, 'items.product_id': productId }
            : { session_id: sessionId, is_active: true, 'items.product_id': productId };
        
        return this.findOneAndUpdate(
            query,
            {
                $set: {
                    'items.$.quantity': quantity
                }
            },
            { new: true }
        );
    }

    static removeItemFromCart(sessionId, userId, productId) {
        const query = userId 
            ? { user_id: userId, is_active: true }
            : { session_id: sessionId, is_active: true };
        
        return this.findOneAndUpdate(
            query,
            {
                $pull: {
                    items: { product_id: productId }
                }
            },
            { new: true }
        );
    }

    static clearCart(sessionId, userId) {
        const query = userId 
            ? { user_id: userId, is_active: true }
            : { session_id: sessionId, is_active: true };
        
        return this.findOneAndUpdate(
            query,
            { is_active: false },
            { new: true }
        );
    }
}

schema.loadClass(Cart);
module.exports = mongoose.model("Cart", schema, "carts");

