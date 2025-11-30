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
 * @desc    Get comments for moderation (ratings don't need approval)
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

        const query = {
            // Only show reviews with comments (ratings don't need approval)
            comment: { $exists: true, $ne: null, $ne: '' }
        };

        if (status !== 'all') {
            query.comment_status = status;
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
 * @desc    Approve or reject a comment (ratings are always visible, only comments need approval)
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

        const review = await Review.findById(req.params.id);

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        // Only approve/reject comments, not ratings
        if (!review.comment || review.comment.trim() === '') {
            throw new ValidationError('This review has no comment to moderate. Ratings are always visible.');
        }

        let updatedReview;
        if (status === Enum.REVIEW_STATUS.APPROVED) {
            updatedReview = await Review.approveComment(req.params.id, req.user._id);
        } else {
            updatedReview = await Review.rejectComment(req.params.id, req.user._id, reason || 'Rejected by product manager');
        }

        res.json({
            success: true,
            message: status === Enum.REVIEW_STATUS.APPROVED ? 'Comment approved' : 'Comment rejected',
            data: await Review.findById(updatedReview._id)
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


