var express = require('express');
var router = express.Router();
const Discount = require('../db/models/Discount');
const Product = require('../db/models/Product');
const Wishlist = require('../db/models/Wishlist');
const Users = require('../db/models/Users');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdminOrSalesManager } = require('../lib/middleware');
const emailService = require('../services/emailService');

/**
 * @route   GET /discounts
 * @desc    Get all discounts
 * @access  Admin & Sales Manager
 */
router.get('/', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const discounts = await Discount.find()
            .populate('products.product_id', 'name price')
            .populate('created_by', 'first_name last_name')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: discounts
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /discounts
 * @desc    Create a new discount and apply to products
 * @access  Admin & Sales Manager
 * @body    { name, description, discount_rate, product_ids[], start_date, end_date }
 */
router.post('/', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const { name, description, discount_rate, product_ids, start_date, end_date } = req.body;

        // Validation
        if (!name || !discount_rate || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            throw new ValidationError('Name, discount_rate, and at least one product_id are required');
        }

        if (discount_rate < 0 || discount_rate > 100) {
            throw new ValidationError('Discount rate must be between 0 and 100');
        }

        if (!start_date || !end_date) {
            throw new ValidationError('Start date and end date are required');
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (endDate <= startDate) {
            throw new ValidationError('End date must be after start date');
        }

        // Fetch products
        const products = await Product.find({ _id: { $in: product_ids } });
        
        if (products.length !== product_ids.length) {
            throw new NotFoundError('One or more products not found');
        }

        // Calculate discounted prices
        const discountProducts = products.map(product => ({
            product_id: product._id,
            original_price: product.price,
            discounted_price: product.price * (1 - discount_rate / 100)
        }));

        // Create discount
        const discount = new Discount({
            name,
            description,
            discount_rate,
            products: discountProducts,
            start_date: startDate,
            end_date: endDate,
            created_by: req.user._id
        });

        await discount.save();

        // Update product prices
        for (const product of products) {
            product.price = product.price * (1 - discount_rate / 100);
            await product.save();
        }

        // Find users with these products in their wishlist
        const wishlists = await Wishlist.find({
            'products.product_id': { $in: product_ids }
        }).populate('user_id', 'email first_name');

        // Send notifications to users
        const notificationPromises = [];
        for (const wishlist of wishlists) {
            const userProducts = wishlist.products.filter(p => 
                product_ids.some(id => id.toString() === p.product_id.toString())
            );

            if (userProducts.length > 0) {
                const productNames = userProducts.map(p => {
                    const product = products.find(pr => pr._id.toString() === p.product_id.toString());
                    return product ? product.name : 'Product';
                }).join(', ');

                // Send email notification
                try {
                    await emailService.sendDiscountNotification(
                        wishlist.user_id,
                        productNames,
                        discount_rate,
                        discount.name
                    );

                    // Mark as notified
                    for (const userProduct of userProducts) {
                        await Wishlist.markDiscountNotified(wishlist.user_id._id, userProduct.product_id);
                    }
                } catch (emailError) {
                    console.error('Failed to send discount notification:', emailError);
                    // Continue with other notifications even if one fails
                }
            }
        }

        // Mark discount as notification sent
        discount.notification_sent = true;
        await discount.save();

        const populatedDiscount = await Discount.findById(discount._id)
            .populate('products.product_id', 'name price')
            .populate('created_by', 'first_name last_name')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Discount created and applied successfully. Users with these products in their wishlist have been notified.',
            data: populatedDiscount
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   GET /discounts/:id
 * @desc    Get a specific discount
 * @access  Admin & Sales Manager
 */
router.get('/:id', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const discount = await Discount.findById(req.params.id)
            .populate('products.product_id', 'name price')
            .populate('created_by', 'first_name last_name')
            .lean();

        if (!discount) {
            throw new NotFoundError('Discount not found');
        }

        res.json({
            success: true,
            data: discount
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid discount ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /discounts/:id
 * @desc    Update a discount
 * @access  Admin & Sales Manager
 */
router.put('/:id', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const discount = await Discount.findById(req.params.id);

        if (!discount) {
            throw new NotFoundError('Discount not found');
        }

        const { name, description, discount_rate, start_date, end_date, is_active } = req.body;

        if (name !== undefined) discount.name = name;
        if (description !== undefined) discount.description = description;
        if (discount_rate !== undefined) {
            if (discount_rate < 0 || discount_rate > 100) {
                throw new ValidationError('Discount rate must be between 0 and 100');
            }
            discount.discount_rate = discount_rate;
        }
        if (start_date !== undefined) discount.start_date = new Date(start_date);
        if (end_date !== undefined) discount.end_date = new Date(end_date);
        if (is_active !== undefined) discount.is_active = is_active;
        
        discount.updated_by = req.user._id;

        await discount.save();

        const populatedDiscount = await Discount.findById(discount._id)
            .populate('products.product_id', 'name price')
            .populate('created_by', 'first_name last_name')
            .lean();

        res.json({
            success: true,
            message: 'Discount updated successfully',
            data: populatedDiscount
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid discount ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /discounts/:id
 * @desc    Delete a discount
 * @access  Admin & Sales Manager
 */
router.delete('/:id', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const discount = await Discount.findById(req.params.id);

        if (!discount) {
            throw new NotFoundError('Discount not found');
        }

        // Restore original prices
        for (const productData of discount.products) {
            const product = await Product.findById(productData.product_id);
            if (product) {
                product.price = productData.original_price;
                await product.save();
            }
        }

        await Discount.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Discount deleted and prices restored'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid discount ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;

