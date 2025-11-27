const express = require("express");
const router = express.Router();
const transporter = require("../lib/mailer");
const { authenticate } = require("../lib/auth");
const Order = require("../db/models/Order");

/**
 * POST /email/send-invoice
 * Body: { orderId, pdfBase64 }
 */
router.post("/send-invoice", authenticate, async (req, res) => {
  try {
    const { orderId, pdfBase64 } = req.body;

    if (!orderId || !pdfBase64) {
      return res.status(400).json({
        success: false,
        error: "Missing orderId or pdfBase64",
      });
    }

    const order = await Order.findById(orderId).populate(
      "customer_id",
      "first_name last_name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const customerName = `${order.customer_id.first_name || ""} ${
      order.customer_id.last_name || ""
    }`.trim();
    const customerEmail = order.customer_id.email;

    const mailOptions = {
      from: `"CS308 TechHub Store" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Your Invoice — Order ${order.order_number}`,
      text: `Hello ${customerName || "Customer"}, your invoice is attached as a PDF.\n\nThank you for your order!`,
      attachments: [
        {
          filename: `invoice-${order.order_number}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Mail sent:", info.messageId);

    res.json({
      success: true,
      message: "Invoice email sent to customer",
    });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
