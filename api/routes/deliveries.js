const express = require('express');
const router = express.Router();
const Delivery = require('../db/models/Delivery');
const Order = require('../db/models/Order');
const { authenticate } = require('../lib/auth');
const { requireAdminOrProductManager } = require('../lib/middleware');
const { NotFoundError, ValidationError } = require('../lib/Error');
const Enum = require('../config/Enum');

// All delivery routes require authentication + product manager (or admin)
router.use(authenticate, requireAdminOrProductManager);

/**
 * @route   GET /deliveries
 * @desc    Get delivery assignments with filtering
 */
router.get('/', async function(req, res, next) {
    try {
        const {
            status = 'all',
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
            const searchConditions = [
                { delivery_address: { $regex: search, $options: 'i' } },
                { tracking_number: { $regex: search, $options: 'i' } }
            ];
            
            // If search looks like an ObjectId, also search by _id
            if (/^[0-9a-fA-F]{24}$/.test(search)) {
                const mongoose = require('mongoose');
                try {
                    searchConditions.push({ _id: new mongoose.Types.ObjectId(search) });
                } catch (e) {
                    // Invalid ObjectId format, ignore
                }
            }
            
            query.$or = searchConditions;
        }

        const [deliveries, total] = await Promise.all([
            Delivery.find(query)
                .populate('customer_id', 'first_name last_name email phone_number')
                .populate('product_id', 'name sku')
                .populate('order_id', 'order_number delivery_address status')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Delivery.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                deliveries,
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
 * @route   PATCH /deliveries/:id/status
 * @desc    Update delivery status and optional tracking number
 */
router.patch('/:id/status', async function(req, res, next) {
    try {
        const { status, tracking_number } = req.body;

        if (!status) {
            throw new ValidationError('Status is required');
        }

        if (!Object.values(Enum.DELIVERY_STATUS).includes(status)) {
            throw new ValidationError('Invalid status supplied');
        }

        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            throw new NotFoundError('Delivery not found');
        }

        delivery.status = status;
        delivery.processed_by = req.user._id;

        if (status === Enum.DELIVERY_STATUS.DELIVERED) {
            delivery.delivery_date = new Date();
        }

        if (tracking_number !== undefined) {
            delivery.tracking_number = tracking_number;
        }

        await delivery.save();

        // Sync delivery status with the associated order if all deliveries complete
        if (delivery.order_id) {
            const siblingDeliveries = await Delivery.find({ order_id: delivery.order_id });
            const order = await Order.findById(delivery.order_id);

            if (order) {
                const statuses = new Set(siblingDeliveries.map(d => d.status));
                if (
                    statuses.size === 1 &&
                    statuses.has(Enum.DELIVERY_STATUS.DELIVERED)
                ) {
                    order.status = Enum.ORDER_STATUS.DELIVERED;
                    order.delivery_date = new Date();
                } else if (statuses.has(Enum.DELIVERY_STATUS.IN_TRANSIT)) {
                    order.status = Enum.ORDER_STATUS.IN_TRANSIT;
                } else if (statuses.has(Enum.DELIVERY_STATUS.PENDING)) {
                    order.status = Enum.ORDER_STATUS.PROCESSING;
                }
                order.updated_by = req.user._id;
                await order.save();
            }
        }

        res.json({
            success: true,
            message: 'Delivery status updated successfully',
            data: await Delivery.findById(delivery._id)
                .populate('customer_id', 'first_name last_name email phone_number')
                .populate('product_id', 'name sku')
                .populate('order_id', 'order_number status')
        });
    } catch (error) {
        if (error.name === 'CastError') {
            next(new NotFoundError('Invalid delivery ID'));
        } else {
            next(error);
        }
    }
});

module.exports = router;


