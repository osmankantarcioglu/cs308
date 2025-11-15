var express = require('express');
var router = express.Router();
const Category = require('../db/models/Category');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdmin, requireAdminOrProductManager } = require('../lib/middleware');

/**
 * @route   GET /categories
 * @desc    Get all categories with optional filtering
 * @params  query params: parent, is_active, search, page, limit
 */
router.get('/', async function(req, res, next) {
    try {
        const { parent, is_active, search, page = 1, limit = 100 } = req.query;
        
        // Build query
        let query = {};
        
        // Filter by parent category
        if (parent === 'null' || parent === '') {
            query.parent_category = null;
        } else if (parent) {
            query.parent_category = parent;
        }
        
        // Filter by active status
        if (typeof is_active !== 'undefined') {
            if (is_active === 'true' || is_active === true) {
                query.is_active = true;
            } else if (is_active === 'false' || is_active === false) {
                query.is_active = false;
            }
        }
        
        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const categories = await Category.find(query)
            .populate('parent_category', 'name')
            .populate('created_by', 'username email')
            .populate('updated_by', 'username email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });
        
        const total = await Category.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                categories,
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
 * @route   GET /categories/:id
 * @desc    Get single category by ID
 */
router.get('/:id', async function(req, res, next) {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent_category', 'name description')
            .populate('created_by', 'username email')
            .populate('updated_by', 'username email');
        
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid category ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   POST /categories
 * @desc    Create a new category
 * @body    { name, description, parent_category, is_active }
 * @access  Admin or Product Manager
 */
router.post('/', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const {
            name,
            description,
            parent_category,
            is_active
        } = req.body;
        
        // Validate required fields
        if (!name) {
            throw new ValidationError('Category name is required');
        }
        
        // Check if parent category exists (if provided)
        if (parent_category) {
            const parent = await Category.findById(parent_category);
            if (!parent) {
                throw new ValidationError('Parent category not found');
            }
        }
        
        // Create category
        const categoryData = {
            name: name.trim(),
            description,
            parent_category: parent_category || null,
            is_active: is_active !== undefined ? is_active : true
        };
        
        // TODO: Get user from auth middleware
        // categoryData.created_by = req.user.id;
        
        const category = new Category(categoryData);
        await category.save();
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: await Category.findById(category._id)
                .populate('parent_category', 'name')
                .populate('created_by', 'username email')
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            next(new ValidationError('Category name already exists'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /categories/:id
 * @desc    Update a category
 * @body    { name, description, parent_category, is_active }
 * @access  Admin or Product Manager
 */
router.put('/:id', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const {
            name,
            description,
            parent_category,
            is_active
        } = req.body;
        
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        // Prevent circular reference (category cannot be its own parent)
        if (parent_category && parent_category === req.params.id) {
            throw new ValidationError('Category cannot be its own parent');
        }
        
        // Check if parent category exists (if provided)
        if (parent_category) {
            const parent = await Category.findById(parent_category);
            if (!parent) {
                throw new ValidationError('Parent category not found');
            }
        }
        
        // Update fields
        if (name !== undefined) category.name = name.trim();
        if (description !== undefined) category.description = description;
        if (parent_category !== undefined) {
            category.parent_category = parent_category || null;
        }
        if (is_active !== undefined) category.is_active = is_active;
        
        // TODO: Get user from auth middleware
        // category.updated_by = req.user.id;
        
        await category.save();
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: await Category.findById(category._id)
                .populate('parent_category', 'name')
                .populate('created_by', 'username email')
                .populate('updated_by', 'username email')
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid category ID'));
        } else if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            next(new ValidationError('Category name already exists'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /categories/:id
 * @desc    Delete a category (soft delete by setting is_active to false)
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdminOrProductManager, async function(req, res, next) {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        // Check if category has subcategories
        const subcategories = await Category.find({ parent_category: req.params.id });
        if (subcategories.length > 0) {
            throw new ValidationError('Cannot delete category with subcategories. Please delete or reassign subcategories first.');
        }
        
        // Check if category has products
        const Product = require('../db/models/Product');
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            throw new ValidationError(`Cannot delete category with ${productsCount} product(s). Please reassign products first.`);
        }
        
        // Soft delete by setting is_active to false
        category.is_active = false;
        
        // TODO: Get user from auth middleware
        // category.updated_by = req.user.id;
        
        await category.save();
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid category ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   DELETE /categories/:id/hard
 * @desc    Permanently delete a category from database
 * @access  Admin only
 */
router.delete('/:id/hard', authenticate, requireAdmin, async function(req, res, next) {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        // Check if category has subcategories
        const subcategories = await Category.find({ parent_category: req.params.id });
        if (subcategories.length > 0) {
            throw new ValidationError('Cannot delete category with subcategories. Please delete or reassign subcategories first.');
        }
        
        // Check if category has products
        const Product = require('../db/models/Product');
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            throw new ValidationError(`Cannot delete category with ${productsCount} product(s). Please reassign products first.`);
        }
        
        await Category.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Category permanently deleted'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid category ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   GET /categories/:id/subcategories
 * @desc    Get all subcategories of a category
 */
router.get('/:id/subcategories', async function(req, res, next) {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        const subcategories = await Category.find({ parent_category: req.params.id })
            .populate('created_by', 'username email')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name
                },
                subcategories
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid category ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;

