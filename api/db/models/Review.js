const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
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
        required: false
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    status: {
        type: String,
        enum: [
            Enum.REVIEW_STATUS.PENDING,
            Enum.REVIEW_STATUS.APPROVED,
            Enum.REVIEW_STATUS.REJECTED
        ],
        default: Enum.REVIEW_STATUS.PENDING
    },
    is_visible: {
        type: Boolean,
        default: false
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    approved_at: {
        type: Date
    },
    rejection_reason: {
        type: String
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
schema.index({ product_id: 1 });
schema.index({ customer_id: 1 });
schema.index({ status: 1 });
schema.index({ is_visible: 1 });

// Compound index to ensure one review per product per customer
schema.index({ product_id: 1, customer_id: 1 }, { unique: true });

class Review extends mongoose.Model {
    static findByProduct(productId) {
        return this.find({
            product_id: productId,
            status: Enum.REVIEW_STATUS.APPROVED,
            is_visible: true
        });
    }

    static findPending() {
        return this.find({ status: Enum.REVIEW_STATUS.PENDING });
    }

    static approveReview(reviewId, approvedBy) {
        return this.findByIdAndUpdate(
            reviewId,
            {
                status: Enum.REVIEW_STATUS.APPROVED,
                is_visible: true,
                approved_by: approvedBy,
                approved_at: new Date()
            },
            { new: true }
        );
    }

    static rejectReview(reviewId, approvedBy, reason) {
        return this.findByIdAndUpdate(
            reviewId,
            {
                status: Enum.REVIEW_STATUS.REJECTED,
                is_visible: false,
                approved_by: approvedBy,
                approved_at: new Date(),
                rejection_reason: reason
            },
            { new: true }
        );
    }

    static getAverageRating(productId) {
        return this.aggregate([
            { $match: { product_id: productId, status: Enum.REVIEW_STATUS.APPROVED } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);
    }

    static canUserReview(customerId, productId, orderId) {
        // Check if the order has been delivered
        return this.findOne({
            customer_id: customerId,
            product_id: productId,
            order_id: orderId
        });
    }
}

schema.loadClass(Review);
module.exports = mongoose.model("Review", schema, "reviews");

