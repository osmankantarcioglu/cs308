const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    discount_rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        original_price: {
            type: Number,
            required: true
        },
        discounted_price: {
            type: Number,
            required: true
        }
    }],
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    notification_sent: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
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
schema.index({ start_date: 1, end_date: 1 });
schema.index({ is_active: 1 });
schema.index({ "products.product_id": 1 });

class Discount extends mongoose.Model {
    static findActive() {
        const now = new Date();
        return this.find({
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now }
        });
    }

    static findByProduct(productId) {
        const now = new Date();
        return this.find({
            "products.product_id": productId,
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now }
        });
    }

    static findNotNotified() {
        return this.find({
            is_active: true,
            notification_sent: false
        });
    }

    static markNotificationsSent(discountId) {
        return this.findByIdAndUpdate(
            discountId,
            { notification_sent: true },
            { new: true }
        );
    }
}

schema.loadClass(Discount);
module.exports = mongoose.model("Discount", schema, "discounts");

