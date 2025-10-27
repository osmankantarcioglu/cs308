const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
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
    total_price: {
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
            Enum.DELIVERY_STATUS.PENDING,
            Enum.DELIVERY_STATUS.IN_TRANSIT,
            Enum.DELIVERY_STATUS.DELIVERED,
            Enum.DELIVERY_STATUS.FAILED
        ],
        default: Enum.DELIVERY_STATUS.PENDING
    },
    delivery_date: {
        type: Date
    },
    tracking_number: {
        type: String
    },
    notes: {
        type: String
    },
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ customer_id: 1 });
schema.index({ order_id: 1 });
schema.index({ status: 1 });
schema.index({ delivery_date: 1 });

class Delivery extends mongoose.Model {
    static findPending() {
        return this.find({ status: Enum.DELIVERY_STATUS.PENDING });
    }

    static findByOrder(orderId) {
        return this.find({ order_id: orderId });
    }

    static findByCustomer(customerId) {
        return this.find({ customer_id: customerId });
    }

    static updateDeliveryStatus(deliveryId, status, trackingNumber = null) {
        const updateData = { status };
        if (trackingNumber) {
            updateData.tracking_number = trackingNumber;
        }
        if (status === Enum.DELIVERY_STATUS.DELIVERED) {
            updateData.delivery_date = new Date();
        }

        return this.findByIdAndUpdate(deliveryId, updateData, { new: true });
    }
}

schema.loadClass(Delivery);
module.exports = mongoose.model("Delivery", schema, "deliveries");

