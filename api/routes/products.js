var express = require('express');
var router = express.Router();
const Product = require('../db/models/Product');
const Review = require('../db/models/Review');
const Order = require('../db/models/Order');
const Delivery = require('../db/models/Delivery');
const Enum = require('../config/Enum');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate, optionalAuthenticate } = require('../lib/auth');
const { requireAdmin, requireAdminOrProductManager } = require('../lib/middleware');

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
 * @route   GET /products/management
 * @desc    Get products for internal dashboards (includes inactive items)
 * @access  Admin or Product Manager
 */
router.get('/management', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const {
            category,
            search,
            status = 'all',
            page = 1,
            limit = 25
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 25));
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (category) {
            query.category = category;
        }

        if (status !== 'all') {
            query.is_active = status === 'active';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { distributor: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .populate('created_by', 'first_name last_name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                products,
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
 * @route   POST /products
 * @desc    Create a new product
 * @body    { name, description, quantity, price, category, ... }
 */
router.post('/', authenticate, requireAdminOrProductManager, async function(req, res, next) {
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
router.put('/:id', authenticate, requireAdminOrProductManager, async function(req, res, next) {
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
router.delete('/:id', authenticate, requireAdminOrProductManager, async function(req, res, next) {
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
router.post('/:id/stock/increase', authenticate, requireAdminOrProductManager, async function(req, res, next) {
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
router.post('/:id/stock/decrease', authenticate, requireAdminOrProductManager, async function(req, res, next) {
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
 * @route   GET /products/:id/reviews
 * @desc    Fetch approved comments and all ratings for a product
 */
router.get('/:id/reviews', async function(req, res, next) {
    try {
        // Ensure product exists to avoid leaking data
        const productExists = await Product.exists({ _id: req.params.id });

        if (!productExists) {
            throw new NotFoundError('Product not found');
        }

        // Get all reviews with approved comments (ratings are always visible)
        const [visibleReviews, allRatings] = await Promise.all([
            Review.find({
                product_id: req.params.id,
                comment_status: Enum.REVIEW_STATUS.APPROVED,
                is_visible: true,
                comment: { $exists: true, $ne: null, $ne: '' }
            })
            .populate('customer_id', 'first_name last_name role')
            .sort({ createdAt: -1 }),
            Review.find({
                product_id: req.params.id,
                rating: { $gte: 1 }
            }).select('rating')
        ]);

        const reviewCount = allRatings.length;
        const averageRating = reviewCount
            ? Number((allRatings.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount).toFixed(1))
            : 0;

        res.json({
            success: true,
            data: {
                reviews: visibleReviews,
                reviewCount,
                averageRating
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

/**
 * Helper function to check if product has been delivered to user
 */
async function checkDeliveryStatus(userId, productId, userRole) {
    if (userRole !== Enum.USER_ROLES.CUSTOMER) {
        // Non-customers can always review
        return { canReview: true, order: null, delivery: null };
    }

    // Find completed order with this product
    const order = await Order.findOne({
        customer_id: userId,
        payment_status: Enum.PAYMENT_STATUS.COMPLETED,
        'items.product_id': productId
    }).sort({ createdAt: -1 });

    if (!order) {
        return { canReview: false, order: null, delivery: null, reason: 'You must purchase this product before leaving a review.' };
    }

    // Check if product has been delivered
    const delivery = await Delivery.findOne({
        customer_id: userId,
        order_id: order._id,
        product_id: productId,
        status: Enum.DELIVERY_STATUS.DELIVERED
    });

    if (!delivery) {
        return { canReview: false, order, delivery: null, reason: 'Product must be delivered before you can leave a review or rating.' };
    }

    return { canReview: true, order, delivery };
}

/**
 * @route   POST /products/:id/rating
 * @desc    Submit or update a rating for a product (ratings are immediately visible, no approval needed)
 */
router.post('/:id/rating', authenticate, async function(req, res, next) {
    try {
        const { rating } = req.body;
        const parsedRating = Number(rating);

        if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
            throw new ValidationError('Rating must be between 1 and 5 stars');
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        // Check delivery status
        const deliveryCheck = await checkDeliveryStatus(req.user._id, req.params.id, req.user.role);
        if (!deliveryCheck.canReview) {
            throw new ValidationError(deliveryCheck.reason);
        }

        // Find or create review
        let review = await Review.findOne({
            product_id: req.params.id,
            customer_id: req.user._id
        });

        if (review) {
            review.rating = parsedRating;
            review.order_id = deliveryCheck.order ? deliveryCheck.order._id : review.order_id;
            review.updated_by = req.user._id;
            await review.save();
        } else {
            review = await Review.create({
                product_id: req.params.id,
                customer_id: req.user._id,
                order_id: deliveryCheck.order ? deliveryCheck.order._id : undefined,
                rating: parsedRating,
                comment_status: Enum.REVIEW_STATUS.PENDING, // Default for when comment is added later
                status: Enum.REVIEW_STATUS.PENDING, // For backward compatibility
                created_by: req.user._id,
                updated_by: req.user._id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            data: review
        });
    } catch (error) {
        if (error.code === 11000) {
            next(new ValidationError('You have already submitted a rating for this product.'));
        } else if (error.name === 'CastError') {
            next(new NotFoundError('Invalid product ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /products/:id/reviews
 * @desc    Submit or update a comment for a product (comments require approval)
 */
router.post('/:id/reviews', authenticate, async function(req, res, next) {
    try {
        const { comment } = req.body;
        const trimmedComment = (comment || '').trim();

        if (!trimmedComment) {
            throw new ValidationError('Comment is required');
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new NotFoundError('Product not found');
        }

        // Check delivery status
        const deliveryCheck = await checkDeliveryStatus(req.user._id, req.params.id, req.user.role);
        if (!deliveryCheck.canReview) {
            throw new ValidationError(deliveryCheck.reason);
        }

        // Find or create review
        let review = await Review.findOne({
            product_id: req.params.id,
            customer_id: req.user._id
        });

        if (review) {
            review.comment = trimmedComment;
            review.comment_status = Enum.REVIEW_STATUS.PENDING; // Comment needs approval
            review.status = Enum.REVIEW_STATUS.PENDING; // For backward compatibility
            review.is_visible = false; // Comment not visible until approved
            review.order_id = deliveryCheck.order ? deliveryCheck.order._id : review.order_id;
            review.updated_by = req.user._id;
            await review.save();
        } else {
            // If no review exists, require a rating first
            throw new ValidationError('Please submit a rating first before adding a comment.');
        }

        res.status(201).json({
            success: true,
            message: 'Comment submitted and awaiting approval',
            data: review
        });
    } catch (error) {
        if (error.code === 11000) {
            next(new ValidationError('You have already submitted a comment for this product.'));
        } else if (error.name === 'CastError') {
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
router.get('/:id/purchased', optionalAuthenticate, async function(req, res, next) {
    try {
        const userId = req.user?._id;
        
        if (!userId) {
            // Guest users haven't purchased anything
            return res.json({
                success: true,
                data: {
                    hasPurchased: false,
                    isDelivered: false
                }
            });
        }
        
        // Check if user has any completed order containing this product
        const orders = await Order.find({
            customer_id: userId,
            payment_status: Enum.PAYMENT_STATUS.COMPLETED,
            'items.product_id': req.params.id
        });
        
        const hasPurchased = orders.length > 0;
        
        // Check if product has been delivered
        let isDelivered = false;
        if (hasPurchased) {
            const delivery = await Delivery.findOne({
                customer_id: userId,
                product_id: req.params.id,
                status: Enum.DELIVERY_STATUS.DELIVERED
            });
            isDelivered = !!delivery;
        }
        
        res.json({
            success: true,
            data: {
                hasPurchased,
                isDelivered
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

module.exports = router;

