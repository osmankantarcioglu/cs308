const express = require('express');
const router = express.Router();
const Order = require('../db/models/Order');
const Cart = require('../db/models/Cart');
const Product = require('../db/models/Product');
const Refund = require('../db/models/Refund');
const Delivery = require('../db/models/Delivery');
const { authenticate } = require('../lib/auth');
const { NotFoundError, ValidationError } = require('../lib/Error');
const Enum = require('../config/Enum');
const { requireAdminOrProductManager } = require('../lib/middleware');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables. Stripe payments will not work.');
    console.warn('   Add STRIPE_SECRET_KEY to your .env file to enable payments.');
}

const generateRefundNumber = () => {
    return `RFD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

/**
 * @route   POST /orders/create-checkout-session
 * @desc    Create Stripe checkout session
 */
router.post('/create-checkout-session', authenticate, async function(req, res, next) {
    try {
        console.log('=== CREATE CHECKOUT SESSION ===');
        console.log('User ID:', req.user._id);
        console.log('Request body:', req.body);
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to .env file.'
            });
        }
        
        const userId = req.user._id;
        const { delivery_address } = req.body;
        
        if (!delivery_address) {
            return res.status(400).json({
                success: false,
                error: 'Delivery address is required'
            });
        }
        
        // Get user's cart - try user_id first, then any active cart
        let cart = await Cart.findOne({ 
            user_id: userId,
            is_active: true 
        }).populate('items.product_id');
        
        // If not found by user_id, try to find any active cart
        if (!cart) {
            cart = await Cart.findOne({ 
                is_active: true 
            }).populate('items.product_id').sort({ updatedAt: -1 }).limit(1);
        }
        
        console.log('Cart found:', cart ? 'Yes' : 'No');
        console.log('Cart items:', cart?.items?.length || 0);
        
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty. Please add items to your cart first.'
            });
        }
        
        // Validate stock availability
        for (const item of cart.items) {
            const product = item.product_id;
            if (!product) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more products in your cart are no longer available'
                });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for ${product.name}. Only ${product.quantity} available.`
                });
            }
        }
        
        // Calculate totals
        let subtotal = 0;
        cart.items.forEach(item => {
            subtotal += item.price_at_time * item.quantity;
        });
        
        const shipping = subtotal >= 100 ? 0 : 15; // Free shipping over $100
        const tax = (subtotal + shipping) * 0.08; // 8% tax on subtotal + shipping
        const total = subtotal + shipping + tax;
        
        console.log('Subtotal:', subtotal, 'Shipping:', shipping, 'Tax:', tax, 'Total:', total);
        
        // Create Stripe line items
        const lineItems = cart.items.map(item => {
            const product = item.product_id;
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name || 'Product',
                        description: product.description || '',
                        images: product.images && product.images.length > 0 ? [product.images[0]] : [],
                    },
                    unit_amount: Math.round(item.price_at_time * 100), // Convert to cents
                },
                quantity: item.quantity,
            };
        });
        
        // Add shipping as a line item (if applicable)
        if (shipping > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Shipping',
                    },
                    unit_amount: Math.round(shipping * 100),
                },
                quantity: 1,
            });
        }
        
        // Add tax as a line item
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Tax (8%)',
                },
                unit_amount: Math.round(tax * 100),
            },
            quantity: 1,
        });
        
        console.log('Creating Stripe session...');
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Only allow card payments
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/basket`,
            locale: 'en', // Force English language
            metadata: {
                userId: userId.toString(),
                delivery_address: delivery_address,
                subtotal: subtotal.toString(),
                shipping: shipping.toString(),
                tax: tax.toString(),
                total: total.toString(),
                cartId: cart._id.toString(),
            },
        });
        
        console.log('Stripe session created:', session.id);
        
        res.json({
            success: true,
            data: {
                sessionId: session.id,
                url: session.url
            }
        });
    } catch (error) {
        console.error('=== CHECKOUT ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create checkout session'
        });
    }
});

/**
 * @route   POST /orders/complete-order
 * @desc    Complete order after successful Stripe payment
 * @body    { sessionId }
 */
router.post('/complete-order', authenticate, async function(req, res, next) {
    try {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to .env file.');
        }
        
        const { sessionId } = req.body;
        
        if (!sessionId) {
            throw new ValidationError('Session ID is required');
        }
        
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            throw new ValidationError('Payment not completed');
        }
        
        const userId = req.user._id;
        
        // Check if order already exists for this session
        const existingOrder = await Order.findOne({ 'credit_card_info.encrypted_data': sessionId });
        if (existingOrder) {
            return res.json({
                success: true,
                message: 'Order already processed',
                data: existingOrder
            });
        }
        
        // Get user's cart
        const cart = await Cart.findOne({ 
            $or: [
                { user_id: userId },
                { session_id: { $exists: true } }
            ],
            is_active: true 
        }).populate('items.product_id');
        
        if (!cart || cart.items.length === 0) {
            throw new ValidationError('Cart is empty');
        }
        
        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Prepare order items and decrease stock
        const orderItems = [];
        for (const item of cart.items) {
            const product = item.product_id;
            
            console.log('Processing cart item:', {
                productId: product?._id,
                productName: product?.name,
                quantity: item.quantity,
                price: item.price_at_time
            });
            
            if (!product || !product._id) {
                throw new NotFoundError(`Product not found in cart item`);
            }
            
            // Get fresh product data to check stock
            const freshProduct = await Product.findById(product._id);
            if (!freshProduct) {
                throw new NotFoundError(`Product ${product.name} not found in database`);
            }
            
            console.log('Fresh product from DB:', {
                id: freshProduct._id,
                name: freshProduct.name,
                currentStock: freshProduct.quantity
            });
            
            if (freshProduct.quantity < item.quantity) {
                throw new ValidationError(`Insufficient stock for ${freshProduct.name}`);
            }
            
            // Decrease stock
            await Product.updateStock(freshProduct._id, item.quantity);
            console.log('Stock decreased for:', freshProduct.name, 'New stock:', freshProduct.quantity - item.quantity);
            
            orderItems.push({
                product_id: freshProduct._id, // Use fresh product ID
                quantity: item.quantity,
                price_at_time: item.price_at_time,
                total_price: item.price_at_time * item.quantity
            });
        }
        
        console.log('Order items prepared:', orderItems.length, 'items');
        
        // Calculate totals from metadata
        const subtotal = parseFloat(session.metadata.subtotal);
        const shipping = parseFloat(session.metadata.shipping || 0);
        const tax = parseFloat(session.metadata.tax);
        const total = parseFloat(session.metadata.total);
        
        console.log('Creating order with totals:', { subtotal, shipping, tax, total });
        
        // Create order
        const order = new Order({
            order_number: orderNumber,
            customer_id: userId,
            items: orderItems,
            subtotal: subtotal,
            shipping_cost: shipping,
            tax_amount: tax,
            discount_amount: 0,
            total_amount: total,
            delivery_address: session.metadata.delivery_address,
            status: Enum.ORDER_STATUS.PROCESSING,
            payment_status: Enum.PAYMENT_STATUS.COMPLETED,
            payment_method: 'stripe',
            credit_card_info: {
                encrypted_data: sessionId // Store session ID for reference
            },
            order_date: new Date()
        });
        
        await order.save();
        
        console.log('Order created:', order.order_number);

        // Create delivery tasks for each order item
        if (orderItems.length > 0) {
            const deliveryPayload = orderItems.map((item) => ({
                customer_id: userId,
                order_id: order._id,
                product_id: item.product_id,
                quantity: item.quantity,
                total_price: item.total_price,
                delivery_address: session.metadata.delivery_address,
                status: Enum.DELIVERY_STATUS.PENDING,
                processed_by: req.user._id
            }));

            await Delivery.insertMany(deliveryPayload);
            console.log('Delivery entries created:', deliveryPayload.length);
        }
        
        // Clear the cart - AGGRESSIVE clearing to ensure it works
        const cartId = session.metadata.cartId;
        
        // Method 1: Clear by cartId
        if (cartId) {
            const result1 = await Cart.findByIdAndUpdate(
                cartId, 
                { $set: { is_active: false, items: [] } },
                { new: true }
            );
            console.log('Cart cleared by ID:', cartId, result1 ? 'Success' : 'Failed');
        }
        
        // Method 2: Clear by user_id (as backup)
        const result2 = await Cart.updateMany(
            { user_id: userId, is_active: true },
            { $set: { is_active: false, items: [] } }
        );
        console.log('Cart cleared by user_id:', userId, 'Modified:', result2.modifiedCount);
        
        // Method 3: Clear by session_id (if exists)
        if (cart.session_id) {
            const result3 = await Cart.updateMany(
                { session_id: cart.session_id, is_active: true },
                { $set: { is_active: false, items: [] } }
            );
            console.log('Cart cleared by session_id:', cart.session_id, 'Modified:', result3.modifiedCount);
        }
        
        res.json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /orders
 * @desc    Get user's orders
 */
router.get('/', authenticate, async function(req, res, next) {
    try {
        const userId = req.user._id;
        const orders = await Order.findByCustomer(userId)
            .populate('items.product_id');
        
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /orders/management/overview
 * @desc    Operational snapshot for product managers (orders, invoices, deliveries)
 * @access  Admin & Product Manager
 */
router.get('/management/overview', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const [
            totalOrders,
            statusBreakdown,
            revenueAgg,
            recentOrders,
            invoiceSnapshots
        ] = await Promise.all([
            Order.countDocuments(),
            Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { payment_status: Enum.PAYMENT_STATUS.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$total_amount' } } }
            ]),
            Order.find({})
                .sort({ updatedAt: -1 })
                .limit(6)
                .select('order_number status total_amount delivery_address updatedAt')
                .lean(),
            Order.find({ invoice_path: { $exists: true, $ne: null } })
                .sort({ order_date: -1 })
                .limit(6)
                .select('order_number invoice_path total_amount order_date customer_id')
                .populate('customer_id', 'first_name last_name email')
                .lean()
        ]);

        const statusMap = {
            [Enum.ORDER_STATUS.PROCESSING]: 0,
            [Enum.ORDER_STATUS.IN_TRANSIT]: 0,
            [Enum.ORDER_STATUS.DELIVERED]: 0,
            [Enum.ORDER_STATUS.CANCELLED]: 0
        };

        statusBreakdown.forEach((entry) => {
            if (statusMap.hasOwnProperty(entry._id)) {
                statusMap[entry._id] = entry.count;
            }
        });

        const responsePayload = {
            totals: {
                totalOrders,
                processing: statusMap[Enum.ORDER_STATUS.PROCESSING],
                inTransit: statusMap[Enum.ORDER_STATUS.IN_TRANSIT],
                delivered: statusMap[Enum.ORDER_STATUS.DELIVERED],
                cancelled: statusMap[Enum.ORDER_STATUS.CANCELLED],
                revenue: revenueAgg[0]?.total || 0
            },
            recentOrders,
            invoices: invoiceSnapshots
        };

        res.json({
            success: true,
            data: responsePayload
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /orders/management/orders
 * @desc    Paginated list of orders for product managers
 */
router.get('/management/orders', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const { status = 'all', search = '', page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (status !== 'all') {
            query.status = status;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { order_number: searchRegex },
                { delivery_address: searchRegex }
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customer_id', 'first_name last_name email phone_number')
                .populate('items.product_id', 'name images sku')
                .sort({ order_date: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PATCH /orders/management/orders/:id/status
 * @desc    Update order delivery status
 */
router.patch('/management/orders/:id/status', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const { status } = req.body;

        if (!status) {
            throw new ValidationError('Status is required');
        }

        const allowedStatuses = [
            Enum.ORDER_STATUS.PROCESSING,
            Enum.ORDER_STATUS.IN_TRANSIT,
            Enum.ORDER_STATUS.DELIVERED
        ];

        if (!allowedStatuses.includes(status)) {
            throw new ValidationError('Invalid status update');
        }

        const order = await Order.findById(req.params.id)
            .populate('customer_id', 'first_name last_name email phone_number')
            .populate('items.product_id', 'name images sku');

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        order.status = status;
        if (status === Enum.ORDER_STATUS.DELIVERED) {
            order.delivery_date = new Date();
        }
        order.updated_by = req.user._id;

        await order.save();

        // Sync delivery tasks with the new status
        const deliveryStatusMap = {
            [Enum.ORDER_STATUS.PROCESSING]: Enum.DELIVERY_STATUS.PENDING,
            [Enum.ORDER_STATUS.IN_TRANSIT]: Enum.DELIVERY_STATUS.IN_TRANSIT,
            [Enum.ORDER_STATUS.DELIVERED]: Enum.DELIVERY_STATUS.DELIVERED
        };

        if (deliveryStatusMap[status]) {
            const updateData = {
                status: deliveryStatusMap[status],
                processed_by: req.user._id
            };

            if (deliveryStatusMap[status] === Enum.DELIVERY_STATUS.DELIVERED) {
                updateData.delivery_date = new Date();
            }

            await Delivery.updateMany(
                { order_id: order._id },
                { $set: updateData }
            );
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid order ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   GET /orders/:id
 * @desc    Get single order
 */
router.get('/:id', authenticate, async function(req, res, next) {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product_id')
            .populate('customer_id', 'first_name last_name email');
        
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        
        // Verify user owns this order
        if (order.customer_id._id.toString() !== req.user._id.toString()) {
            throw new ValidationError('You can only view your own orders');
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid order ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /orders/:id/cancel
 * @desc    Cancel an order (only if status is PROCESSING)
 */
router.post('/:id/cancel', authenticate, async function(req, res, next) {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        
        // Verify user owns this order
        if (order.customer_id.toString() !== req.user._id.toString()) {
            throw new ValidationError('You can only cancel your own orders');
        }
        
        // Check if order can be cancelled
        if (order.status !== Enum.ORDER_STATUS.PROCESSING) {
            throw new ValidationError('Only orders in processing status can be cancelled');
        }
        
        // Restore stock for cancelled items
        for (const item of order.items) {
            await Product.addStock(item.product_id, item.quantity);
        }
        
        // Update order status
        order.status = Enum.ORDER_STATUS.CANCELLED;
        await order.save();
        
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid order ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /orders/:id/refund
 * @desc    Request refund for delivered order (within 30 days)
 */
router.post('/:id/refund', authenticate, async function(req, res, next) {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        
        // Verify user owns this order
        if (order.customer_id.toString() !== req.user._id.toString()) {
            throw new ValidationError('You can only request refunds for your own orders');
        }
        
        // Check if order is delivered
        if (order.status !== Enum.ORDER_STATUS.DELIVERED) {
            throw new ValidationError('Only delivered orders can be refunded');
        }
        
        // Check if within 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (order.order_date < thirtyDaysAgo) {
            throw new ValidationError('Refund period has expired (30 days)');
        }
        
        // Check if refund already exists
        const existingRefund = await Refund.findOne({ order_id: order._id });
        if (existingRefund) {
            throw new ValidationError('Refund request already exists for this order');
        }
        
        // Create refund requests for each item in the order
        const refundEntries = order.items.map((item) => ({
            refund_number: generateRefundNumber(),
            order_id: order._id,
            customer_id: req.user._id,
            product_id: item.product_id,
            quantity: item.quantity,
            purchase_price: item.price_at_time,
            refund_amount: item.price_at_time * item.quantity,
            reason: reason || 'Customer requested refund',
            status: Enum.REFUND_STATUS.PENDING
        }));

        const createdRefunds = await Refund.insertMany(refundEntries);
        
        res.json({
            success: true,
            message: 'Refund request submitted successfully',
            data: createdRefunds
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid order ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;

