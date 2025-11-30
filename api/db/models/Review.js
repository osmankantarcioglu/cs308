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
        max: 5  // Only 1-5 star ratings
    },
    comment: {
        type: String
    },
    // Status for comment approval (ratings are always visible)
    comment_status: {
        type: String,
        enum: [
            Enum.REVIEW_STATUS.PENDING,
            Enum.REVIEW_STATUS.APPROVED,
            Enum.REVIEW_STATUS.REJECTED
        ],
        default: Enum.REVIEW_STATUS.PENDING
    },
    // Legacy status field for backward compatibility (maps to comment_status)
    status: {
        type: String,
        enum: [
            Enum.REVIEW_STATUS.PENDING,
            Enum.REVIEW_STATUS.APPROVED,
            Enum.REVIEW_STATUS.REJECTED
        ],
        default: Enum.REVIEW_STATUS.PENDING
    },
    // Comments are only visible when approved
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
schema.index({ comment_status: 1 });
schema.index({ is_visible: 1 });

// Compound index to ensure one review per product per customer
schema.index({ product_id: 1, customer_id: 1 }, { unique: true });

// Pre-save hook to sync status with comment_status for backward compatibility
schema.pre('save', function(next) {
    if (this.isModified('comment_status') && !this.isModified('status')) {
        this.status = this.comment_status;
    } else if (this.isModified('status') && !this.isModified('comment_status')) {
        this.comment_status = this.status;
    }
    next();
});

class Review extends mongoose.Model {
    static findByProduct(productId) {
        // Return reviews with approved comments (ratings are always visible)
        return this.find({
            product_id: productId,
            comment_status: Enum.REVIEW_STATUS.APPROVED,
            is_visible: true,
            comment: { $exists: true, $ne: null, $ne: '' }
        });
    }

    static findPending() {
        // Find reviews with pending comments
        return this.find({ 
            comment_status: Enum.REVIEW_STATUS.PENDING,
            comment: { $exists: true, $ne: null, $ne: '' }
        });
    }

    static approveComment(reviewId, approvedBy) {
        // Approve only the comment, rating is already visible
        return this.findByIdAndUpdate(
            reviewId,
            {
                comment_status: Enum.REVIEW_STATUS.APPROVED,
                status: Enum.REVIEW_STATUS.APPROVED, // Keep for backward compatibility
                is_visible: true,
                approved_by: approvedBy,
                approved_at: new Date()
            },
            { new: true }
        );
    }

    static rejectComment(reviewId, approvedBy, reason) {
        // Reject only the comment, rating remains visible
        return this.findByIdAndUpdate(
            reviewId,
            {
                comment_status: Enum.REVIEW_STATUS.REJECTED,
                status: Enum.REVIEW_STATUS.REJECTED, // Keep for backward compatibility
                is_visible: false,
                approved_by: approvedBy,
                approved_at: new Date(),
                rejection_reason: reason
            },
            { new: true }
        );
    }

    // Legacy methods for backward compatibility
    static approveReview(reviewId, approvedBy) {
        return this.approveComment(reviewId, approvedBy);
    }

    static rejectReview(reviewId, approvedBy, reason) {
        return this.rejectComment(reviewId, approvedBy, reason);
    }

    static getAverageRating(productId) {
        // Calculate average from all ratings (ratings are always visible)
        return this.aggregate([
            { $match: { product_id: productId } },
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

