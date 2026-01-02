const express = require("express");
const router = express.Router();
const Coupon = require("../db/models/Coupon");

router.get("/validate", async (req, res, next) => {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    const subtotal = Number(req.query.subtotal || 0);

    if (!code) return res.status(400).json({ valid: false, message: "Coupon code is required." });

    const coupon = await Coupon.findOne({ code, is_active: true });
    if (!coupon) return res.json({ valid: false, message: "Invalid coupon code." });

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.json({ valid: false, message: "Coupon has expired." });
    }

    if (subtotal < (coupon.min_subtotal || 0)) {
      return res.json({ valid: false, message: `Minimum subtotal is $${coupon.min_subtotal}.` });
    }

    const discount_amount = Number(((subtotal * coupon.discount_rate) / 100).toFixed(2));

    return res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discount_rate: coupon.discount_rate,
        min_subtotal: coupon.min_subtotal,
        is_active: coupon.is_active,
        expires_at: coupon.expires_at,
      },
      discount_amount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
