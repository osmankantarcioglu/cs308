const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create transporter - configure based on environment variables
let transporter = null;

function initializeEmailService() {
    // For development, use Ethereal Email (fake SMTP) if no SMTP config provided
    // For production, configure with real SMTP settings
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Use Ethereal Email for testing (creates a fake SMTP account)
        // In production, you should configure real SMTP settings
        console.warn('⚠️  SMTP not configured. Using Ethereal Email for testing.');
        console.warn('   Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env for production.');
       
        // For now, we'll create a test account or use a mock
        // In a real scenario, you'd want to set up proper SMTP
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_USER || 'test@ethereal.email',
                pass: process.env.ETHEREAL_PASS || 'test123'
            }
        });
    }
}

// Initialize on module load
initializeEmailService();

/**
 * Send invoice email with PDF attachment
 * @param {Object} invoice - Invoice document
 * @param {Object} order - Order document
 * @param {Object} customer - Customer/user document
 * @returns {Promise<Object>} - Email send result
 */
async function sendInvoiceEmail(invoice, order, customer) {
    try {
        if (!transporter) {
            throw new Error('Email service not initialized. Please configure SMTP settings.');
        }

        const pdfPath = path.join(__dirname, '..', 'public', invoice.pdf_path);
       
        // Check if PDF file exists
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`Invoice PDF not found at ${pdfPath}`);
        }

        const customerName = customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.email;

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@company.com',
            to: customer.email,
            subject: `Invoice #${invoice.invoice_number} - Order #${order.order_number}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9fafb; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Thank You for Your Order!</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${customerName},</p>
                            <p>Your order has been confirmed and payment has been received.</p>
                            <p><strong>Order Number:</strong> ${order.order_number}</p>
                            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                            <p><strong>Total Amount:</strong> $${invoice.total_amount.toFixed(2)}</p>
                            <p>Please find your invoice attached to this email.</p>
                            <p>If you have any questions about your order, please don't hesitate to contact us.</p>
                            <p>Best regards,<br>Your Company Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Thank You for Your Order!
               
                Dear ${customerName},
               
                Your order has been confirmed and payment has been received.
               
                Order Number: ${order.order_number}
                Invoice Number: ${invoice.invoice_number}
                Total Amount: $${invoice.total_amount.toFixed(2)}
               
                Please find your invoice attached to this email.
               
                If you have any questions about your order, please don't hesitate to contact us.
               
                Best regards,
                Your Company Team
            `,
            attachments: [
                {
                    filename: `invoice-${invoice.invoice_number}.pdf`,
                    path: pdfPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Invoice email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
}

/**
 * Send discount notification email to users with products in wishlist
 * @param {Object} user - User document
 * @param {String} productNames - Comma-separated product names
 * @param {Number} discountRate - Discount rate percentage
 * @param {String} discountName - Name of the discount
 * @returns {Promise<Object>} - Email send result
 */
async function sendDiscountNotification(user, productNames, discountRate, discountName) {
    try {
        if (!transporter) {
            throw new Error('Email service not initialized. Please configure SMTP settings.');
        }

        const customerName = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email;

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@company.com',
            to: user.email,
            subject: `🎉 Special Discount Alert: ${discountRate}% OFF on Your Wishlist Items!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 30px; background-color: #f9fafb; }
                        .discount-badge { display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; border-radius: 5px; font-size: 24px; font-weight: bold; margin: 20px 0; }
                        .product-list { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Special Discount Alert!</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${customerName},</p>
                            <p>Great news! Items from your wishlist are now on sale!</p>
                            <div style="text-align: center;">
                                <div class="discount-badge">${discountRate}% OFF</div>
                            </div>
                            <div class="product-list">
                                <h3>Discounted Products:</h3>
                                <p>${productNames}</p>
                            </div>
                            <p><strong>Discount Name:</strong> ${discountName}</p>
                            <p>Don't miss out on this amazing deal! Visit our store now to take advantage of these savings.</p>
                            <div style="text-align: center;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Shop Now</a>
                            </div>
                            <p>Best regards,<br>Your Company Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Special Discount Alert!
               
                Dear ${customerName},
               
                Great news! Items from your wishlist are now on sale!
               
                Discount: ${discountRate}% OFF
                Discount Name: ${discountName}
               
                Discounted Products:
                ${productNames}
               
                Don't miss out on this amazing deal! Visit our store now to take advantage of these savings.
               
                Best regards,
                Your Company Team
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Discount notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending discount notification email:', error);
        throw error;
    }
}

/**
 * Send refund approval notification email to customer
 * @param {Object} customer - Customer/user document
 * @param {Object} refund - Refund document
 * @param {Object} product - Product document
 * @param {Object} order - Order document
 * @returns {Promise<Object>} - Email send result
 */
async function sendRefundApprovalNotification(customer, refund, product, order) {
    try {
        if (!transporter) {
            throw new Error('Email service not initialized. Please configure SMTP settings.');
        }

        const customerName = customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.email;

        const productName = product.name || 'Product';
        const orderNumber = order?.order_number || 'N/A';
        const refundAmount = refund.refund_amount?.toFixed(2) || '0.00';

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@company.com',
            to: customer.email,
            subject: `Refund Approved - ${refund.refund_number}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 30px; background-color: #f9fafb; }
                        .refund-badge { display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; border-radius: 5px; font-size: 24px; font-weight: bold; margin: 20px 0; }
                        .details-box { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }
                        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                        .detail-row:last-child { border-bottom: none; }
                        .detail-label { font-weight: bold; color: #6b7280; }
                        .detail-value { color: #111827; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ Refund Approved</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${customerName},</p>
                            <p>Good news! Your refund request has been approved.</p>
                            
                            <div style="text-align: center;">
                                <div class="refund-badge">$${refundAmount}</div>
                            </div>

                            <div class="details-box">
                                <h3 style="margin-top: 0;">Refund Details</h3>
                                <div class="detail-row">
                                    <span class="detail-label">Refund Number:</span>
                                    <span class="detail-value">${refund.refund_number}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Order Number:</span>
                                    <span class="detail-value">${orderNumber}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Product:</span>
                                    <span class="detail-value">${productName}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Quantity:</span>
                                    <span class="detail-value">${refund.quantity}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Refund Amount:</span>
                                    <span class="detail-value"><strong>$${refundAmount}</strong></span>
                                </div>
                            </div>

                            <p>The refund amount of <strong>$${refundAmount}</strong> will be processed and returned to your original payment method within 5-10 business days.</p>
                            
                            <p>If you have any questions about this refund, please contact our customer service team.</p>
                            
                            <p>Thank you for your patience,<br>Your Company Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Refund Approved

                Dear ${customerName},

                Good news! Your refund request has been approved.

                Refund Number: ${refund.refund_number}
                Order Number: ${orderNumber}
                Product: ${productName}
                Quantity: ${refund.quantity}
                Refund Amount: $${refundAmount}

                The refund amount of $${refundAmount} will be processed and returned to your original payment method within 5-10 business days.

                If you have any questions about this refund, please contact our customer service team.

                Thank you for your patience,
                Your Company Team
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Refund approval email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending refund approval email:', error);
        throw error;
    }
}

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
async function verifyEmailConfig() {
    try {
        if (!transporter) {
            return false;
        }
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('Email configuration verification failed:', error);
        return false;
    }
}

module.exports = {
    sendInvoiceEmail,
    sendDiscountNotification,
    sendRefundApprovalNotification,
    verifyEmailConfig,
    initializeEmailService
};