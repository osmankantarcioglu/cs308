const express = require('express');
const router = express.Router();
const Users = require('../db/models/Users');
const Product = require('../db/models/Product');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdmin } = require('../lib/middleware');
const Enum = require('../config/Enum');
const bcrypt = require('bcryptjs');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /admin/users
 * @desc    Get all users with filtering and pagination
 * @query   role, is_active, search, page, limit
 * @access  Admin only
 */
router.get('/users', async (req, res, next) => {
    try {
        const { role, is_active, search, page = 1, limit = 50 } = req.query;

        const query = {};

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Filter by status
        if (typeof is_active !== 'undefined') {
            query.is_active = is_active === 'true' || is_active === true;
        }

        // Search by name or email
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { email: searchRegex }
            ];
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        const users = await Users.find(query)
            .select('-password')
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .lean();

        const total = await Users.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
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
 * @route   GET /admin/users/:id
 * @desc    Get single user by ID
 * @access  Admin only
 */
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id).select('-password');
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /admin/users
 * @desc    Create new user (admin only)
 * @body    { email, password, first_name, last_name, role, phone_number?, taxID?, home_address?, is_active?, language? }
 * @access  Admin only
 */
router.post('/users', async (req, res, next) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            role,
            phone_number,
            taxID,
            home_address,
            is_active,
            language
        } = req.body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name) {
            throw new ValidationError('Missing required fields: email, password, first_name, last_name');
        }

        // Validate role
        const validRoles = [
            Enum.USER_ROLES.ADMIN,
            Enum.USER_ROLES.CUSTOMER,
            Enum.USER_ROLES.SALES_MANAGER,
            Enum.USER_ROLES.PRODUCT_MANAGER,
            Enum.USER_ROLES.SUPPORT_AGENT
        ];

        if (role && !validRoles.includes(role)) {
            throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        // Check if email already exists
        const existingUser = await Users.findByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userData = {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            first_name,
            last_name,
            role: role || Enum.USER_ROLES.CUSTOMER,
            created_by: req.user._id
        };

        if (phone_number) userData.phone_number = phone_number;
        if (taxID) userData.taxID = taxID;
        if (home_address) userData.home_address = home_address;
        if (typeof is_active !== 'undefined') userData.is_active = is_active;
        if (language) userData.language = language;

        const user = new Users(userData);
        await user.save();

        const safeUser = await Users.findById(user._id).select('-password');
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: safeUser
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {})[0] || 'field';
            next(new ValidationError(`${dupField} already exists`));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /admin/users/:id
 * @desc    Update user (admin only)
 * @body    { email?, password?, first_name?, last_name?, role?, phone_number?, taxID?, home_address?, is_active?, language? }
 * @access  Admin only
 */
router.put('/users/:id', async (req, res, next) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            role,
            phone_number,
            taxID,
            home_address,
            is_active,
            language
        } = req.body;

        const user = await Users.findById(req.params.id);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Prevent admin from modifying their own role or status (safety measure)
        if (user._id.toString() === req.user._id.toString()) {
            if (role !== undefined && role !== user.role) {
                throw new ValidationError('Cannot change your own role');
            }
            if (is_active !== undefined && is_active === false) {
                throw new ValidationError('Cannot deactivate your own account');
            }
        }

        // Validate role if provided
        if (role) {
            const validRoles = [
                Enum.USER_ROLES.ADMIN,
                Enum.USER_ROLES.CUSTOMER,
                Enum.USER_ROLES.SALES_MANAGER,
                Enum.USER_ROLES.PRODUCT_MANAGER,
                Enum.USER_ROLES.SUPPORT_AGENT
            ];
            if (!validRoles.includes(role)) {
                throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
            }
        }

        // Update fields
        if (email !== undefined) {
            const emailLower = email.toLowerCase().trim();
            if (emailLower !== user.email) {
                const existingUser = await Users.findByEmail(emailLower);
                if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                    throw new ValidationError('Email already exists');
                }
                user.email = emailLower;
            }
        }
        if (password !== undefined && password.trim() !== '') {
            // Hash new password if provided
            user.password = await bcrypt.hash(password, 10);
        }
        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (role !== undefined) user.role = role;
        if (phone_number !== undefined) user.phone_number = phone_number;
        if (taxID !== undefined) user.taxID = taxID;
        if (home_address !== undefined) user.home_address = home_address;
        if (typeof is_active !== 'undefined') user.is_active = is_active;
        if (language !== undefined) user.language = language;

        user.updated_by = req.user._id;
        await user.save();

        const safeUser = await Users.findById(user._id).select('-password');
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: safeUser
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {})[0] || 'field';
            next(new ValidationError(`${dupField} already exists`));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /admin/users/:id/role
 * @desc    Change user role (admin only)
 * @body    { role: "sales_manager" | "product_manager" | "support_agent" }
 * @access  Admin only
 */
router.put('/users/:id/role', async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!role) {
            throw new ValidationError('Role is required');
        }

        const allowedRoles = [
            Enum.USER_ROLES.SALES_MANAGER,
            Enum.USER_ROLES.PRODUCT_MANAGER,
            Enum.USER_ROLES.SUPPORT_AGENT
        ];

        if (!allowedRoles.includes(role)) {
            throw new ValidationError(`Role must be one of: ${allowedRoles.join(', ')}`);
        }

        const user = await Users.findById(req.params.id);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user._id.toString()) {
            throw new ValidationError('Cannot change your own role');
        }

        user.role = role;
        user.updated_by = req.user._id;
        await user.save();

        const safeUser = await Users.findById(user._id).select('-password');
        
        res.json({
            success: true,
            message: 'User role updated successfully',
            data: safeUser
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /admin/users/:id
 * @desc    Deactivate user (soft delete)
 * @access  Admin only
 */
router.delete('/users/:id', async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Prevent admin from deactivating themselves
        if (user._id.toString() === req.user._id.toString()) {
            throw new ValidationError('Cannot deactivate your own account');
        }

        user.is_active = false;
        user.updated_by = req.user._id;
        await user.save();

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /admin/users/:id/hard
 * @desc    Permanently delete user
 * @access  Admin only
 */
router.delete('/users/:id/hard', async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            throw new ValidationError('Cannot delete your own account');
        }

        await Users.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User permanently deleted'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /admin/users/:id/activate
 * @desc    Activate a deactivated user
 * @access  Admin only
 */
router.post('/users/:id/activate', async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id);
        
        if (!user) {
            throw new NotFoundError('User not found');
        }

        user.is_active = true;
        user.updated_by = req.user._id;
        await user.save();

        const safeUser = await Users.findById(user._id).select('-password');
        
        res.json({
            success: true,
            message: 'User activated successfully',
            data: safeUser
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid user ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /admin/products/:id
 * @desc    Delete product (admin only)
 * @access  Admin only
 */
router.delete('/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        // Soft delete
        product.is_active = false;
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
 * @route   DELETE /admin/products/:id/hard
 * @desc    Permanently delete product (admin only)
 * @access  Admin only
 */
router.delete('/products/:id/hard', async (req, res, next) => {
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
 * @route   GET /admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 */
router.get('/stats', async (req, res, next) => {
    try {
        const totalUsers = await Users.countDocuments();
        const activeUsers = await Users.countDocuments({ is_active: true });
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ is_active: true });
        // Categories moved to /categories router; keep stats if model available
        const Category = require('../db/models/Category');
        const totalCategories = await Category.countDocuments();
        const activeCategories = await Category.countDocuments({ is_active: true });

        const usersByRole = await Users.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                    byRole: usersByRole.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                products: {
                    total: totalProducts,
                    active: activeProducts,
                    inactive: totalProducts - activeProducts
                },
                categories: {
                    total: totalCategories,
                    active: activeCategories,
                    inactive: totalCategories - activeCategories
                }
            }
        });
    } catch (error) {
        next(error);
    }
});


module.exports = router;

