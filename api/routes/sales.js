var express = require('express');
var router = express.Router();
const Order = require('../db/models/Order');
const Invoice = require('../db/models/Invoice');
const Product = require('../db/models/Product');
const Refund = require('../db/models/Refund');
const Enum = require('../config/Enum');
const { NotFoundError, ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdminOrSalesManager } = require('../lib/middleware');
const emailService = require('../services/emailService');

/**
 * @route   GET /sales/analytics
 * @desc    Get revenue and profit/loss analytics for a date range
 * @access  Admin & Sales Manager
 * @query   start_date, end_date
 */
router.get('/analytics', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            throw new ValidationError('Start date and end date are required');
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date

        if (endDate <= startDate) {
            throw new ValidationError('End date must be after start date');
        }

        // Get all completed orders in the date range
        const orders = await Order.find({
            payment_status: Enum.PAYMENT_STATUS.COMPLETED,
            order_date: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .populate('items.product_id', 'cost price')
        .lean();

        // Calculate totals
        let totalRevenue = 0;
        let totalCost = 0;

        // Group by date for daily breakdown
        const dailyDataMap = new Map();

        for (const order of orders) {
            const orderDate = new Date(order.order_date).toISOString().split('T')[0];
            
            let orderRevenue = 0;
            let orderCost = 0;

            for (const item of order.items) {
                // Revenue is the price at time of order
                const itemRevenue = item.price_at_time * item.quantity;
                orderRevenue += itemRevenue;

                // Cost: use cost_at_time if saved in order (for historical accuracy)
                // Otherwise fallback to product.cost or 50% of price_at_time
                let itemCostPerUnit;
                if (item.cost_at_time !== undefined && item.cost_at_time !== null) {
                    // Use the cost that was saved at the time of order
                    itemCostPerUnit = item.cost_at_time;
                } else {
                    // Fallback for old orders that don't have cost_at_time
                    const product = item.product_id;
                    itemCostPerUnit = product?.cost || (item.price_at_time * 0.5);
                }
                
                const itemCost = itemCostPerUnit * item.quantity;
                orderCost += itemCost;
            }

            totalRevenue += orderRevenue;
            totalCost += orderCost;

            // Add to daily data
            if (!dailyDataMap.has(orderDate)) {
                dailyDataMap.set(orderDate, { revenue: 0, cost: 0, profit: 0 });
            }
            const dailyData = dailyDataMap.get(orderDate);
            dailyData.revenue += orderRevenue;
            dailyData.cost += orderCost;
            dailyData.profit = dailyData.revenue - dailyData.cost;
        }

        // Convert daily data map to array
        const dailyData = Array.from(dailyDataMap.entries())
            .map(([date, data]) => ({
                date,
                revenue: data.revenue,
                cost: data.cost,
                profit: data.profit
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const netProfit = totalRevenue - totalCost;

        res.json({
            success: true,
            data: {
                total_revenue: totalRevenue,
                total_cost: totalCost,
                net_profit: netProfit,
                profit_margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0,
                total_orders: orders.length,
                daily_data: dailyData,
                date_range: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /sales/refunds
 * @desc    Get all refund requests with filters
 * @access  Admin & Sales Manager
 * @query   status, page, limit
 */
router.get('/refunds', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status) {
            query.status = status;
        }

        const [refunds, total] = await Promise.all([
            Refund.find(query)
                .populate('customer_id', 'first_name last_name email')
                .populate('order_id', 'order_number order_date')
                .populate('product_id', 'name images')
                .populate('approved_by', 'first_name last_name')
                .sort({ request_date: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Refund.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                refunds,
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
 * @route   GET /sales/refunds/:id
 * @desc    Get specific refund request
 * @access  Admin & Sales Manager
 */
router.get('/refunds/:id', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const refund = await Refund.findById(req.params.id)
            .populate('customer_id', 'first_name last_name email')
            .populate('order_id', 'order_number order_date')
            .populate('product_id', 'name images price quantity')
            .populate('approved_by', 'first_name last_name')
            .lean();

        if (!refund) {
            throw new NotFoundError('Refund request not found');
        }

        res.json({
            success: true,
            data: refund
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid refund ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /sales/refunds/:id/approve
 * @desc    Approve refund request (mark product returned, add to stock, send email)
 * @access  Admin & Sales Manager
 * @body    { product_returned: Boolean } - Mark product as returned
 */
router.put('/refunds/:id/approve', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const { product_returned } = req.body;
        
        const refund = await Refund.findById(req.params.id)
            .populate('customer_id', 'first_name last_name email')
            .populate('product_id')
            .populate('order_id', 'order_number');

        if (!refund) {
            throw new NotFoundError('Refund request not found');
        }

        if (refund.status !== Enum.REFUND_STATUS.PENDING) {
            throw new ValidationError('Only pending refunds can be approved');
        }

        // Mark product as returned if specified
        if (product_returned) {
            refund.product_returned = true;
        }

        // Approve refund
        refund.status = Enum.REFUND_STATUS.APPROVED;
        refund.approved_by = req.user._id;
        refund.approval_date = new Date();

        // Add product back to stock
        if (!refund.stock_added_back) {
            const product = await Product.findById(refund.product_id._id);
            if (product) {
                product.quantity = (product.quantity || 0) + refund.quantity;
                await product.save();
                refund.stock_added_back = true;
            }
        }

        await refund.save();

        // Send email notification
        try {
            await emailService.sendRefundApprovalNotification(
                refund.customer_id,
                refund,
                refund.product_id,
                refund.order_id
            );
            refund.email_notification_sent = true;
            await refund.save();
        } catch (emailError) {
            console.error('Failed to send refund approval email:', emailError);
            // Don't fail the approval if email fails
        }

        const updatedRefund = await Refund.findById(refund._id)
            .populate('customer_id', 'first_name last_name email')
            .populate('product_id', 'name images')
            .populate('order_id', 'order_number')
            .populate('approved_by', 'first_name last_name')
            .lean();

        res.json({
            success: true,
            message: 'Refund approved successfully. Product added back to stock and customer notified.',
            data: updatedRefund
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid refund ID'));
        } else {
            next(error);
        }
    }
});

/**
 * @route   PUT /sales/refunds/:id/reject
 * @desc    Reject refund request
 * @access  Admin & Sales Manager
 * @body    { rejection_reason: String }
 */
router.put('/refunds/:id/reject', authenticate, requireAdminOrSalesManager, async function(req, res, next) {
    try {
        const { rejection_reason } = req.body;
        
        const refund = await Refund.findById(req.params.id);

        if (!refund) {
            throw new NotFoundError('Refund request not found');
        }

        if (refund.status !== Enum.REFUND_STATUS.PENDING) {
            throw new ValidationError('Only pending refunds can be rejected');
        }

        refund.status = Enum.REFUND_STATUS.REJECTED;
        refund.approved_by = req.user._id;
        refund.approval_date = new Date();
        refund.rejection_reason = rejection_reason || 'Refund request rejected';

        await refund.save();

        const updatedRefund = await Refund.findById(refund._id)
            .populate('customer_id', 'first_name last_name email')
            .populate('product_id', 'name images')
            .populate('order_id', 'order_number')
            .populate('approved_by', 'first_name last_name')
            .lean();

        res.json({
            success: true,
            message: 'Refund request rejected',
            data: updatedRefund
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid refund ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;

