var express = require('express');
var router = express.Router();
const Order = require('../db/models/Order');
const Invoice = require('../db/models/Invoice');
const Product = require('../db/models/Product');
const Enum = require('../config/Enum');
const { ValidationError } = require('../lib/Error');
const { authenticate } = require('../lib/auth');
const { requireAdminOrSalesManager } = require('../lib/middleware');

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
                const product = item.product_id;
                if (product) {
                    // Revenue is the price at time of order
                    const itemRevenue = item.price_at_time * item.quantity;
                    orderRevenue += itemRevenue;

                    // Cost: use product cost if available, otherwise default to 50% of sale price
                    const productCost = product.cost || (item.price_at_time * 0.5);
                    const itemCost = productCost * item.quantity;
                    orderCost += itemCost;
                }
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

module.exports = router;

