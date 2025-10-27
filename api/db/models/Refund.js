const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    refund_number: {
        type: String,
        unique: true,
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    purchase_price: {
        type: Number,
        required: true
    },
    refund_amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String
    },
    status: {
        type: String,
        enum: [
            Enum.REFUND_STATUS.PENDING,
            Enum.REFUND_STATUS.APPROVED,
            Enum.REFUND_STATUS.REJECTED,
            Enum.REFUND_STATUS.PROCESSED
        ],
        default: Enum.REFUND_STATUS.PENDING
    },
    request_date: {
        type: Date,
        default: Date.now
    },
    approval_date: {
        type: Date
    },
    processed_date: {
        type: Date
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    rejection_reason: {
        type: String
    },
    product_returned: {
        type: Boolean,
        default: false
    },
    stock_added_back: {
        type: Boolean,
        default: false
    },
    email_notification_sent: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ customer_id: 1 });
schema.index({ order_id: 1 });
schema.index({ status: 1 });
schema.index({ request_date: 1 });

class Refund extends mongoose.Model {
    static findByCustomer(customerId) {
        return this.find({ customer_id: customerId }).sort({ request_date: -1 });
    }

    static findPending() {
        return this.find({ status: Enum.REFUND_STATUS.PENDING });
    }

    static findByOrder(orderId) {
        return this.find({ order_id: orderId });
    }

    static approveRefund(refundId, approvedBy) {
        return this.findByIdAndUpdate(
            refundId,
            {
                status: Enum.REFUND_STATUS.APPROVED,
                approved_by: approvedBy,
                approval_date: new Date()
            },
            { new: true }
        );
    }

    static processRefund(refundId) {
        return this.findByIdAndUpdate(
            refundId,
            {
                status: Enum.REFUND_STATUS.PROCESSED,
                processed_date: new Date()
            },
            { new: true }
        );
    }

    static rejectRefund(refundId, approvedBy, reason) {
        return this.findByIdAndUpdate(
            refundId,
            {
                status: Enum.REFUND_STATUS.REJECTED,
                approved_by: approvedBy,
                approval_date: new Date(),
                rejection_reason: reason
            },
            { new: true }
        );
    }

    static canRequestRefund(customerId, orderId, productId) {
        // Check if order is delivered and within 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return this.findOne({
            customer_id: customerId,
            order_id: orderId,
            product_id: productId
        });
    }
}

schema.loadClass(Refund);
module.exports = mongoose.model("Refund", schema, "refunds");

