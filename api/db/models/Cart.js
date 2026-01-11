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
        return this.findOne({ session_id: sessionId, is_active: true, user_id: null });
    }

    static async addItemToCart(sessionId, userId, productId, quantity, price) {
        const query = userId
            ? { user_id: userId, is_active: true }
            : { session_id: sessionId, is_active: true, user_id: null };

        // First, find the cart
        let cart = await this.findOne(query);

        if (!cart) {
            // Create new cart
            cart = new this({
                user_id: userId || null,
                session_id: sessionId,
                items: [],
                is_active: true
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product_id.toString() === productId.toString()
        );

        if (existingItemIndex >= 0) {
            // Product exists, update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // New product, add to cart
            cart.items.push({
                product_id: productId,
                quantity: quantity,
                price_at_time: price
            });
        }

        await cart.save();
        return cart;
    }

    static updateItemQuantity(sessionId, userId, productId, quantity) {
        const query = userId
            ? { user_id: userId, is_active: true, 'items.product_id': productId }
            : { session_id: sessionId, is_active: true, 'items.product_id': productId, user_id: null };

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
            : { session_id: sessionId, is_active: true, user_id: null };

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
            : { session_id: sessionId, is_active: true, user_id: null };

        return this.findOneAndUpdate(
            query,
            { is_active: false },
            { new: true }
        );
    }

    /**
     * Merge guest cart (by session_id) with user cart (by user_id)
     * If user has an existing cart, merge items. Otherwise, assign guest cart to user.
     */
    static async mergeCarts(sessionId, userId) {
        if (!sessionId || !userId) {
            return null;
        }

        // Find guest cart and user cart
        const guestCart = await this.findBySession(sessionId);
        const userCart = await this.findByUser(userId);

        // If no guest cart, return user cart (or null)
        if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
            return userCart;
        }

        // If no user cart, just assign guest cart to user
        if (!userCart || !userCart.items || userCart.items.length === 0) {
            guestCart.user_id = userId;
            await guestCart.save();
            return guestCart;
        }

        // Merge items: combine quantities for same products, add new products
        // Create a map to track products and their quantities
        const productMap = new Map();

        // First, add all user cart items to the map
        userCart.items.forEach(item => {
            const productIdStr = item.product_id.toString();
            productMap.set(productIdStr, {
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_time: item.price_at_time
            });
        });

        // Then, merge guest cart items
        guestCart.items.forEach(guestItem => {
            const productIdStr = guestItem.product_id.toString();
            if (productMap.has(productIdStr)) {
                // Product exists in user cart, combine quantities
                const existingItem = productMap.get(productIdStr);
                existingItem.quantity += guestItem.quantity;
            } else {
                // New product, add to map
                productMap.set(productIdStr, {
                    product_id: guestItem.product_id,
                    quantity: guestItem.quantity,
                    price_at_time: guestItem.price_at_time
                });
            }
        });

        // Convert map back to array of items
        const mergedItems = Array.from(productMap.values());

        // Update user cart with merged items (clear and set new items)
        userCart.items = [];
        userCart.items = mergedItems;
        await userCart.save();

        // Deactivate guest cart
        guestCart.is_active = false;
        await guestCart.save();

        return userCart;
    }
}

schema.loadClass(Cart);
module.exports = mongoose.model("Cart", schema, "carts");
