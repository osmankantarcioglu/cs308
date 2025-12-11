var express = require('express');
var router = express.Router();
const Cart = require('../db/models/Cart');
const Product = require('../db/models/Product');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { optionalAuthenticate } = require('../lib/auth');

// Middleware to get session ID (for now, we'll use a simple session generator)
function getSessionId(req, res, next) {
    // Generate or get session ID from cookies
    let sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
        // Generate a simple session ID
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set cookie
    res.cookie('sessionId', sessionId, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow client-side access for debugging
        sameSite: 'lax',
        secure: false // Allow cookies on localhost
    });
    
    req.sessionId = sessionId;
    next();
}

/**
 * @route   GET /cart
 * @desc    Get cart items
 */
router.get('/', getSessionId, optionalAuthenticate, async function(req, res, next) {
    try {
        const userId = req.user?._id; // User ID from optional auth
        
        const cart = userId 
            ? await Cart.findByUser(userId)
            : await Cart.findBySession(req.sessionId);
        
        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    total: 0,
                    itemCount: 0
                }
            });
        }
        
        // Populate product details
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product_id');
        
        // Calculate totals
        let total = 0;
        let itemCount = 0;
        
        populatedCart.items.forEach(item => {
            const itemTotal = item.quantity * item.price_at_time;
            total += itemTotal;
            itemCount += item.quantity;
        });
        
        res.json({
            success: true,
            data: {
                items: populatedCart.items,
                total: total.toFixed(2),
                itemCount
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /cart/add
 * @desc    Add item to cart
 * @body    { productId, quantity }
 */
router.post('/add', getSessionId, optionalAuthenticate, async function(req, res, next) {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user?._id; // User ID from optional auth
        
        if (!productId) {
            throw new ValidationError('Product ID is required');
        }
        
        if (quantity < 1) {
            throw new ValidationError('Quantity must be at least 1');
        }
        
        // Get product details
        const product = await Product.findById(productId);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        if (product.quantity < quantity) {
            throw new ValidationError(`Insufficient stock. Only ${product.quantity} available.`);
        }
        
        // Add to cart
        const updatedCart = await Cart.addItemToCart(
            req.sessionId,
            userId,
            productId,
            quantity,
            product.price
        );
        
        res.json({
            success: true,
            message: 'Product added to cart successfully',
            data: updatedCart
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new ValidationError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /cart/update/:productId
 * @desc    Update item quantity in cart
 * @body    { quantity }
 */
router.put('/update/:productId', getSessionId, optionalAuthenticate, async function(req, res, next) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user?._id; // User ID from optional auth
        
        if (!quantity || quantity < 1) {
            throw new ValidationError('Quantity must be at least 1');
        }
        
        // Get product to check stock
        const product = await Product.findById(productId);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        if (product.quantity < quantity) {
            throw new ValidationError(`Insufficient stock. Only ${product.quantity} available.`);
        }
        
        const updatedCart = await Cart.updateItemQuantity(
            req.sessionId,
            userId,
            productId,
            quantity
        );
        
        if (!updatedCart) {
            throw new NotFoundError('Cart or cart item not found');
        }
        
        res.json({
            success: true,
            message: 'Cart item quantity updated',
            data: updatedCart
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new ValidationError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /cart/remove/:productId
 * @desc    Remove item from cart
 */
router.delete('/remove/:productId', getSessionId, optionalAuthenticate, async function(req, res, next) {
    try {
        const { productId } = req.params;
        const userId = req.user?._id; // User ID from optional auth
        
        const updatedCart = await Cart.removeItemFromCart(
            req.sessionId,
            userId,
            productId
        );
        
        if (!updatedCart) {
            throw new NotFoundError('Cart not found');
        }
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            data: updatedCart
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new ValidationError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /cart/clear
 * @desc    Clear all items from cart
 */
router.delete('/clear', getSessionId, optionalAuthenticate, async function(req, res, next) {
    try {
        const userId = req.user?._id; // User ID from optional auth
        
        const updatedCart = await Cart.clearCart(req.sessionId, userId);
        
        if (!updatedCart) {
            throw new NotFoundError('Cart not found');
        }
        
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
