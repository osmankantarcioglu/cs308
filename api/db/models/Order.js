const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    order_number: {
        type: String,
        unique: true,
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price_at_time: {
            type: Number,
            required: true
        },
        total_price: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    shipping_cost: {
        type: Number,
        default: 0
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    delivery_address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [
            Enum.ORDER_STATUS.PROCESSING,
            Enum.ORDER_STATUS.IN_TRANSIT,
            Enum.ORDER_STATUS.DELIVERED,
            Enum.ORDER_STATUS.CANCELLED
        ],
        default: Enum.ORDER_STATUS.PROCESSING
    },
    payment_status: {
        type: String,
        enum: [
            Enum.PAYMENT_STATUS.PENDING,
            Enum.PAYMENT_STATUS.COMPLETED,
            Enum.PAYMENT_STATUS.FAILED,
            Enum.PAYMENT_STATUS.REFUNDED
        ],
        default: Enum.PAYMENT_STATUS.PENDING
    },
    payment_method: {
        type: String
    },
    credit_card_info: {
        // Encrypted credit card information
        last_four: String,
        encrypted_data: String
    },
    order_date: {
        type: Date,
        default: Date.now
    },
    delivery_date: {
        type: Date
    },
    invoice_path: {
        type: String // Path to PDF invoice
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ customer_id: 1 });
schema.index({ order_number: 1 });
schema.index({ status: 1 });
schema.index({ order_date: 1 });

class Order extends mongoose.Model {
    static findByCustomer(customerId) {
        return this.find({ customer_id: customerId }).sort({ order_date: -1 });
    }

    static findByStatus(status) {
        return this.find({ status });
    }

    static findByDateRange(startDate, endDate) {
        return this.find({
            order_date: {
                $gte: startDate,
                $lte: endDate
            }
        });
    }

    static findCancellableOrders(customerId) {
        return this.find({
            customer_id: customerId,
            status: Enum.ORDER_STATUS.PROCESSING
        });
    }

    static findRefundableOrders(customerId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return this.find({
            customer_id: customerId,
            status: Enum.ORDER_STATUS.DELIVERED,
            order_date: { $gte: thirtyDaysAgo }
        });
    }
}

schema.loadClass(Order);
module.exports = mongoose.model("Order", schema, "orders");

