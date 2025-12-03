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
    verifyEmailConfig,
    initializeEmailService
};