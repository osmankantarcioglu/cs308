const express = require('express');
const router = express.Router();
const Review = require('../db/models/Review');
const { authenticate } = require('../lib/auth');
const { requireAdminOrProductManager } = require('../lib/middleware');
const { NotFoundError, ValidationError } = require('../lib/Error');
const Enum = require('../config/Enum');

router.use(authenticate, requireAdminOrProductManager);

/**
 * @route   GET /reviews/management
 * @desc    Get reviews for moderation
 */
router.get('/management', async function(req, res, next) {
    try {
        const {
            status = Enum.REVIEW_STATUS.PENDING,
            search = '',
            page = 1,
            limit = 25
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 25));
        const skip = (pageNum - 1) * limitNum;

        const query = {};

        if (status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: 'i' } },
                { rejection_reason: { $regex: search, $options: 'i' } }
            ];
        }

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('product_id', 'name sku')
                .populate('customer_id', 'first_name last_name email')
                .populate('order_id', 'order_number')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Review.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                reviews,
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
 * @route   PATCH /reviews/:id/status
 * @desc    Approve or reject a review
 */
router.patch('/:id/status', async function(req, res, next) {
    try {
        const { status, reason } = req.body;

        if (!status) {
            throw new ValidationError('Status is required');
        }

        if (![Enum.REVIEW_STATUS.APPROVED, Enum.REVIEW_STATUS.REJECTED].includes(status)) {
            throw new ValidationError('Invalid status provided');
        }

        let review;
        if (status === Enum.REVIEW_STATUS.APPROVED) {
            review = await Review.approveReview(req.params.id, req.user._id);
        } else {
            review = await Review.rejectReview(req.params.id, req.user._id, reason || 'Rejected by product manager');
        }

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        res.json({
            success: true,
            message: status === Enum.REVIEW_STATUS.APPROVED ? 'Review approved' : 'Review rejected',
            data: await Review.findById(review._id)
                .populate('product_id', 'name sku')
                .populate('customer_id', 'first_name last_name email')
                .populate('order_id', 'order_number')
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid review ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;


