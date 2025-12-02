const transporter = require("./mailer");
const Wishlist = require("../db/models/Wishlist");
const Discount = require("../db/models/Discount");
const Product = require("../db/models/Product");


async function sendWishlistDiscountNotificationsForDiscount(discountDoc) {
  if (!discountDoc || !Array.isArray(discountDoc.products)) {
    return { discountId: discountDoc?._id, emailsSent: 0 };
  }

  let emailsSent = 0;

  for (const p of discountDoc.products) {
    const productId = p.product_id;
    if (!productId) continue;

    const product = await Product.findById(productId);
    if (!product) continue;

    const wishlists = await Wishlist.findByProduct(productId)
      .populate("user_id", "first_name last_name email");

    if (!wishlists.length) continue;

    console.log(
      `💡 Discount ${discountDoc._id} - product ${product.name} için ${wishlists.length} wishlist bulundu`
    );

    for (const wl of wishlists) {
      const user = wl.user_id;
      if (!user || !user.email) continue;

      const original = p.original_price;
      const discounted = p.discounted_price;

      const mailOptions = {
        from: `"CS308 TechHub Store" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Good news! "${product.name}" from your wishlist is now on discount 🎉`,
        text: `Hello ${user.first_name || "there"},

A product in your wishlist is now discounted:

Product: ${product.name}
Discount: ${discountDoc.discount_rate}% (${discountDoc.name})
Original price: $${original?.toFixed ? original.toFixed(2) : original}
Discounted price: $${discounted?.toFixed ? discounted.toFixed(2) : discounted}

Visit the store to see the updated price and complete your purchase.

Best regards,
CS308 TechHub Store`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Wishlist discount email sent:", info.messageId);
        emailsSent += 1;

        await Wishlist.markDiscountNotified(user._id, productId);
      } catch (err) {
        console.error("❌ Error sending wishlist discount mail:", err.message);
      }
    }
  }

  await Discount.markNotificationsSent(discountDoc._id);

  return { discountId: discountDoc._id, emailsSent };
}


async function runWishlistDiscountNotifications() {
  const discounts = await Discount.findNotNotified(); // is_active=true, notification_sent=false
  if (!discounts.length) {
    console.log("ℹ No discounts pending wishlist notifications.");
    return { processedDiscounts: 0, totalEmails: 0 };
  }

  let totalEmails = 0;
  for (const d of discounts) {
    const result = await sendWishlistDiscountNotificationsForDiscount(d);
    totalEmails += result.emailsSent;
  }

  return {
    processedDiscounts: discounts.length,
    totalEmails,
  };
}

module.exports = {
  sendWishlistDiscountNotificationsForDiscount,
  runWishlistDiscountNotifications,
};
