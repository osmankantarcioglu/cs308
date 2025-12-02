// api/lib/invoiceEmail.js
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

/**
 * Gmail transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // .env
      pass: process.env.EMAIL_PASS, // .env
    },
  });
}

function buildInvoicePdfBuffer(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ----- COMPANY HEADER -----
    doc
      .fontSize(20)
      .fillColor('#3b82f6')
      .text('CS308 TechHub Store', { align: 'left' });

    doc
      .moveDown(0.5)
      .fontSize(10)
      .fillColor('#111827')
      .text('Orta Mah. Kampus Cd. Sabanci Universitesi')
      .text('Tuzla / Istanbul')
      .moveDown(0.5)
      .text('support@cs308-techhub.com')
      .text('cs308-techhub.com');

    doc.moveDown();
    doc
      .fontSize(14)
      .fillColor('#2563eb')
      .text(`Invoice #${order.order_number}`, { align: 'right' });

    doc
      .fontSize(10)
      .fillColor('#111827')
      .text(`Date: ${new Date(order.order_date).toLocaleDateString('en-US')}`, {
        align: 'right',
      });

    doc.moveDown();

    // ----- BILL TO -----
    const customer = order.customer_id || {};
    const fullName = [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(' ');

    doc
      .fontSize(12)
      .fillColor('#8b5cf6')
      .text('Bill To', { underline: true });

    doc
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#111827')
      .text(fullName || 'Customer')
      .text(order.delivery_address || '')
      .text(customer.email || '');

    doc.moveDown();

    // ----- ITEMS TABLE -----
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Items')
      .moveDown(0.5);

    const tableTop = doc.y;
    const colX = {
      name: 50,
      qty: 280,
      price: 330,
      total: 420,
    };

    doc
      .fontSize(10)
      .fillColor('#4B5563')
      .text('Item', colX.name, tableTop)
      .text('Qty', colX.qty, tableTop)
      .text('Price', colX.price, tableTop)
      .text('Total', colX.total, tableTop);

    doc
      .moveTo(50, tableTop + 12)
      .lineTo(550, tableTop + 12)
      .strokeColor('#E5E7EB')
      .stroke();

    let y = tableTop + 18;

    (order.items || []).forEach((it) => {
      const product = it.product_id || {};
      const name = product.name || 'Item';
      const qty = it.quantity || 1;
      const price = it.price_at_time || 0;
      const total = price * qty;

      doc
        .fontSize(10)
        .fillColor('#111827')
        .text(name, colX.name, y)
        .text(String(qty), colX.qty, y)
        .text(`$${price.toFixed(2)}`, colX.price, y)
        .text(`$${total.toFixed(2)}`, colX.total, y);

      y += 16;
    });

    doc.moveDown(2);

    // ----- TOTALS -----
    const rightLabelX = 350;
    const rightValueX = 520;

    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('Subtotal:', rightLabelX, y)
      .text(`$${(order.subtotal || 0).toFixed(2)}`, rightValueX, y, {
        align: 'right',
      });
    y += 14;

    doc
      .text('Tax:', rightLabelX, y)
      .text(`$${(order.tax_amount || 0).toFixed(2)}`, rightValueX, y, {
        align: 'right',
      });
    y += 14;

    doc
      .text('Shipping:', rightLabelX, y)
      .text(`$${(order.shipping_cost || 0).toFixed(2)}`, rightValueX, y, {
        align: 'right',
      });
    y += 18;

    doc
      .fontSize(12)
      .fillColor('#2563eb')
      .text('Grand Total:', rightLabelX, y)
      .text(`$${(order.total_amount || 0).toFixed(2)}`, rightValueX, y, {
        align: 'right',
      });

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text(
        'Thank you for your purchase! This invoice was generated for the CS308 project.',
        { align: 'left' }
      );

    doc.end();
  });
}

async function sendInvoiceEmail(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ EMAIL_USER or EMAIL_PASS not set. Skipping email.');
    return;
  }

  const customer = order.customer_id || {};
  const toEmail = customer.email;
  if (!toEmail) {
    console.warn('⚠ Order has no customer email. Skipping email.');
    return;
  }

  const transporter = createTransporter();

  const pdfBuffer = await buildInvoicePdfBuffer(order);

  const mailOptions = {
    from: `"CS308 TechHub Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your invoice - ${order.order_number}`,
    text: `Hello ${customer.first_name || ''},

Thank you for your purchase from CS308 TechHub Store.

Your invoice is attached as a PDF file.

Best regards,
CS308 TechHub Store`,
    attachments: [
      {
        filename: `invoice-${order.order_number}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Invoice email sent:', info.messageId);
}

module.exports = { sendInvoiceEmail };
