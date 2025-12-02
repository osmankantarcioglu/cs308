const transporter = require("./mailer");
const Refund = require("../db/models/Refund");
const Enum = require("../config/Enum");


async function sendRefundStatusEmail(refundId) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠ EMAIL_USER or EMAIL_PASS not set. Skipping refund email.");
    return;
  }

  const refund = await Refund.findById(refundId)
    .populate("customer_id", "first_name last_name email")
    .populate("order_id", "order_number")
    .populate("product_id", "name");

  if (!refund) {
    console.warn("⚠ Refund not found for email:", refundId);
    return;
  }

  if (refund.email_notification_sent) {
    console.log("Refund email already sent for", refund.refund_number);
    return;
  }

  const customer = refund.customer_id || {};
  const order = refund.order_id || {};
  const product = refund.product_id || {};

  const customerName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ") || "Customer";

  const toEmail = customer.email;
  if (!toEmail) {
    console.warn("⚠ Refund has no customer email, skipping email.");
    return;
  }

  let subject;
  let textBody;

  if (refund.status === Enum.REFUND_STATUS.APPROVED) {
    subject = `Your refund has been approved - ${refund.refund_number}`;
    textBody = `Hello ${customerName},

Your refund request for order ${order.order_number} has been APPROVED.

Product: ${product.name || "Product"}
Quantity: ${refund.quantity}
Refund amount: $${refund.refund_amount.toFixed(2)}

The refund will be processed to your original payment method.

Best regards,
CS308 TechHub Store`;
  } else if (refund.status === Enum.REFUND_STATUS.REJECTED) {
    subject = `Your refund request has been rejected - ${refund.refund_number}`;
    textBody = `Hello ${customerName},

Your refund request for order ${order.order_number} has been REJECTED.

Product: ${product.name || "Product"}
Quantity: ${refund.quantity}
Requested amount: $${refund.refund_amount.toFixed(2)}

Reason: ${refund.rejection_reason || "Not specified."}

If you have any questions, please contact our support team.

Best regards,
CS308 TechHub Store`;
  } else if (refund.status === Enum.REFUND_STATUS.PROCESSED) {
    subject = `Your refund has been processed - ${refund.refund_number}`;
    textBody = `Hello ${customerName},

Your approved refund for order ${order.order_number} has been PROCESSED.

Refund amount: $${refund.refund_amount.toFixed(2)} has been sent to your original payment method.

Best regards,
CS308 TechHub Store`;
  } else {
    console.log("Refund status is PENDING, skipping email.");
    return;
  }

  const mailOptions = {
    from: `"CS308 TechHub Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    text: textBody,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Refund email sent:", info.messageId);

  refund.email_notification_sent = true;
  await refund.save();
}

module.exports = { sendRefundStatusEmail };
