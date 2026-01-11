const express = require("express");
const router = express.Router();
const Coupon = require("../db/models/Coupon");

router.get("/", async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      is_active: true,
      $or: [
        { expires_at: { $gt: new Date() } },
        { expires_at: null }
      ]
    }).select('code discount_rate');

    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    next(err);
  }
});

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
const { authenticate } = require("../lib/auth");

router.post("/spin", authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();

    // Calculate eligibility
    if (user.last_spin_at) {
      const lastSpin = new Date(user.last_spin_at);
      const nextSpin = new Date(lastSpin.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

      if (now < nextSpin) {
        return res.status(403).json({
          success: false,
          message: "You must wait before spinning again.",
          nextSpinAt: nextSpin
        });
      }
    }

    // Update user
    req.user.last_spin_at = now;
    await req.user.save();

    res.json({ success: true, message: "Spin allowed", lastSpinAt: now });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
