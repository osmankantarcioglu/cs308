const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount_rate: { type: Number, required: true, min: 1, max: 90 }, // % off
    min_subtotal: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    expires_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", schema, "coupons");
