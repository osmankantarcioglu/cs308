const express = require("express");
const router = express.Router();
const { authenticate } = require("../lib/auth");
const { requireAdminOrProductManager } = require("../lib/middleware");
const {
  runWishlistDiscountNotifications,
} = require("../lib/wishlistEmail");


router.post(
  "/wishlist/discounts/run",
  authenticate,
  requireAdminOrProductManager,
  async (req, res, next) => {
    try {
      const result = await runWishlistDiscountNotifications();
      res.json({
        success: true,
        message: "Wishlist discount notifications processed",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
