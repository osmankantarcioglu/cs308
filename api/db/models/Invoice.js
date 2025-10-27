const mongoose = require("mongoose");

const schema = mongoose.Schema({
    invoice_number: {
        type: String,
        unique: true,
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        unique: true
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
        name: String,
        quantity: Number,
        unit_price: Number,
        total_price: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    },
    customer_details: {
        name: String,
        email: String,
        address: String
    },
    invoice_date: {
        type: Date,
        default: Date.now
    },
    pdf_path: {
        type: String // Path to PDF file
    },
    email_sent: {
        type: Boolean,
        default: false
    },
    email_sent_at: {
        type: Date
    },
    payment_method: String,
    billing_address: String
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ invoice_number: 1 });
schema.index({ order_id: 1 });
schema.index({ customer_id: 1 });
schema.index({ invoice_date: 1 });

class Invoice extends mongoose.Model {
    static findByOrder(orderId) {
        return this.findOne({ order_id: orderId });
    }

    static findByCustomer(customerId) {
        return this.find({ customer_id: customerId }).sort({ invoice_date: -1 });
    }

    static findByDateRange(startDate, endDate) {
        return this.find({
            invoice_date: {
                $gte: startDate,
                $lte: endDate
            }
        });
    }

    static markEmailSent(invoiceId) {
        return this.findByIdAndUpdate(
            invoiceId,
            {
                email_sent: true,
                email_sent_at: new Date()
            },
            { new: true }
        );
    }
}

schema.loadClass(Invoice);
module.exports = mongoose.model("Invoice", schema, "invoices");

