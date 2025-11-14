var express = require('express');
var router = express.Router();
const Product = require('../db/models/Product');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdmin } = require('../lib/middleware');

/**
 * @route   GET /products
 * @desc    Get all products with optional filtering
 * @params  query params: category, search, minPrice, maxPrice, page, limit
 */
router.get('/', async function(req, res, next) {
    try {
        const { category, search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        const Category = require('../db/models/Category');
        
        // Get active category IDs first (more efficient)
        const activeCategories = await Category.find({ is_active: true }).select('_id');
        const activeCategoryIds = activeCategories.map(cat => cat._id);
        
        // Build query
        let query = {};
        
        // Only show active products
        query.is_active = true;
        
        // Filter by category (only if category is provided)
        if (category) {
            // Verify requested category is active
            if (!activeCategoryIds.some(id => id.toString() === category)) {
                // Requested category is inactive, return empty results
                return res.json({
                    success: true,
                    data: {
                        products: [],
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            total: 0,
                            pages: 0
                        }
                    }
                });
            }
            query.category = category;
        } else {
            // If no category filter, only show products with active categories (or no category)
            query.$or = [
                { category: { $in: activeCategoryIds } },
                { category: null }
            ];
        }
        
        // Search by name or description
        if (search) {
            const searchCondition = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
            // If we already have $or for category, use $and to combine
            if (query.$or) {
                query = {
                    ...query,
                    $and: [
                        { $or: query.$or },
                        searchCondition
                    ]
                };
                delete query.$or;
            } else {
                query.$or = searchCondition.$or;
            }
        }
        
        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Find products with active categories
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('created_by', 'username email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ popularity_score: -1, createdAt: -1 });
        
        // Get total count
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /products/:id
 * @desc    Get single product by ID
 * @query   incrementView=true to increment view count (optional)
 */
router.get('/:id', async function(req, res, next) {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('created_by', 'username email')
            .populate('updated_by', 'username email');
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        // Only increment view count if explicitly requested via query param
        if (req.query.incrementView === 'true') {
            await Product.incrementViewCount(req.params.id);
            
            // Fetch updated product with new view count
            const updatedProduct = await Product.findById(req.params.id)
                .populate('category', 'name')
                .populate('created_by', 'username email')
                .populate('updated_by', 'username email');
            
            return res.json({
                success: true,
                data: updatedProduct
            });
        }
        
        res.json({
            success: true,
            data: product
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
 * @route   POST /products
 * @desc    Create a new product
 * @body    { name, description, quantity, price, category, ... }
 */
router.post('/', async function(req, res, next) {
    try {
        const {
            name,
            model,
            serial_number,
            description,
            quantity,
            price,
            cost,
            warranty_status,
            distributor,
            category,
            images,
            is_active
        } = req.body;
        
        // Validate required fields
        if (!name || !description || quantity === undefined || !price) {
            throw new ValidationError('Missing required fields: name, description, quantity, and price are required');
        }
        
        // Create product
        const productData = {
            name,
            description,
            quantity: parseInt(quantity),
            price: parseFloat(price)
        };
        
        // Add optional fields if provided
        if (model) productData.model = model;
        if (serial_number) productData.serial_number = serial_number;
        if (cost !== undefined) productData.cost = parseFloat(cost);
        if (warranty_status) productData.warranty_status = warranty_status;
        if (distributor) productData.distributor = distributor;
        if (category) productData.category = category;
        if (images && Array.isArray(images)) productData.images = images;
        if (is_active !== undefined) productData.is_active = is_active;
        
        const product = new Product(productData);
        
        // TODO: Get user from auth middleware
        // product.created_by = req.user.id;
        
        await product.save();
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: await Product.findById(product._id)
                .populate('category', 'name')
                .populate('created_by', 'username email')
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            next(new ValidationError('Serial number already exists'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /products/:id
 * @desc    Update a product
 * @body    { name, description, quantity, price, ... }
 */
router.put('/:id', async function(req, res, next) {
    try {
        const {
            name,
            model,
            serial_number,
            description,
            quantity,
            price,
            cost,
            warranty_status,
            distributor,
            category,
            images,
            is_active
        } = req.body;
        
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        // Update fields
        if (name !== undefined) product.name = name;
        if (model !== undefined) product.model = model;
        if (serial_number !== undefined) product.serial_number = serial_number;
        if (description !== undefined) product.description = description;
        if (quantity !== undefined) product.quantity = parseInt(quantity);
        if (price !== undefined) product.price = parseFloat(price);
        if (cost !== undefined) product.cost = parseFloat(cost);
        if (warranty_status !== undefined) product.warranty_status = warranty_status;
        if (distributor !== undefined) product.distributor = distributor;
        if (category !== undefined) product.category = category;
        if (images !== undefined && Array.isArray(images)) product.images = images;
        if (is_active !== undefined) product.is_active = is_active;
        
        // TODO: Get user from auth middleware
        // product.updated_by = req.user.id;
        
        await product.save();
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: await Product.findById(product._id)
                .populate('category', 'name')
                .populate('created_by', 'username email')
                .populate('updated_by', 'username email')
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid product ID'));
        } else if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            next(new ValidationError('Serial number already exists'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /products/:id
 * @desc    Delete a product (soft delete by setting is_active to false)
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, async function(req, res, next) {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        // Soft delete by setting is_active to false
        product.is_active = false;
        
        // TODO: Get user from auth middleware
        // product.updated_by = req.user.id;
        
        await product.save();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
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
 * @route   DELETE /products/:id/hard
 * @desc    Permanently delete a product from database
 * @access  Admin only
 */
router.delete('/:id/hard', authenticate, requireAdmin, async function(req, res, next) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        res.json({
            success: true,
            message: 'Product permanently deleted'
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
 * @route   POST /products/:id/stock/increase
 * @desc    Increase product stock quantity
 * @body    { quantity: number }
 */
router.post('/:id/stock/increase', async function(req, res, next) {
    try {
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0) {
            throw new ValidationError('Valid quantity is required');
        }
        
        const product = await Product.addStock(req.params.id, parseInt(quantity));
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        res.json({
            success: true,
            message: 'Stock increased successfully',
            data: product
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
 * @route   POST /products/:id/stock/decrease
 * @desc    Decrease product stock quantity
 * @body    { quantity: number }
 */
router.post('/:id/stock/decrease', async function(req, res, next) {
    try {
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0) {
            throw new ValidationError('Valid quantity is required');
        }
        
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        
        if (product.quantity < parseInt(quantity)) {
            throw new ValidationError('Insufficient stock');
        }
        
        const updatedProduct = await Product.updateStock(req.params.id, parseInt(quantity));
        
        res.json({
            success: true,
            message: 'Stock decreased successfully',
            data: updatedProduct
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
 * @route   GET /products/:id/purchased
 * @desc    Check if the current user has purchased this product
 */
router.get('/:id/purchased', async function(req, res, next) {
    try {
        const userId = req.user?.id; // Will be set by auth middleware
        
        if (!userId) {
            // Guest users haven't purchased anything
            return res.json({
                success: true,
                data: {
                    hasPurchased: false
                }
            });
        }
        
        const Order = require('../db/models/Order');
        const Enum = require('../config/Enum');
        
        // Check if user has any completed order containing this product
        const orders = await Order.find({
            customer_id: userId,
            payment_status: Enum.PAYMENT_STATUS.COMPLETED,
            'items.product_id': req.params.id
        });
        
        res.json({
            success: true,
            data: {
                hasPurchased: orders.length > 0
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;

