const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF invoice for an order
 * @param {Object} order - Order document with populated items and customer
 * @param {Object} invoice - Invoice document
 * @returns {Promise<string>} - Path to the generated PDF file
 */
async function generateInvoicePDF(order, invoice) {
    return new Promise((resolve, reject) => {
        try {
            // Create invoices directory if it doesn't exist
            const invoicesDir = path.join(__dirname, '..', 'public', 'invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            // Generate PDF file path
            const fileName = `invoice-${invoice.invoice_number}-${Date.now()}.pdf`;
            const filePath = path.join(invoicesDir, fileName);
            const relativePath = `/invoices/${fileName}`;

            // Create PDF document
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
               .fillColor('#1e40af')
               .text('INVOICE', { align: 'center' });
           
            doc.moveDown();
            doc.fontSize(10)
               .fillColor('#666666')
               .text(`Invoice #: ${invoice.invoice_number}`, { align: 'center' });
            doc.text(`Order #: ${order.order_number}`, { align: 'center' });
            doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, { align: 'center' });

            doc.moveDown(2);

            // Company Info (Left)
            doc.fontSize(12)
               .fillColor('#000000')
               .text('From:', 50, doc.y);
            doc.fontSize(10)
               .fillColor('#333333')
               .text('Your Company Name', 50, doc.y + 5)
               .text('123 Business Street', 50, doc.y + 5)
               .text('City, State 12345', 50, doc.y + 5)
               .text('Email: info@company.com', 50, doc.y + 5);

            // Customer Info (Right)
            const customerY = doc.y - 40;
            doc.fontSize(12)
               .fillColor('#000000')
               .text('Bill To:', 350, customerY);
            doc.fontSize(10)
               .fillColor('#333333')
               .text(invoice.customer_details.name || `${order.customer_id.first_name} ${order.customer_id.last_name}`, 350, customerY + 5)
               .text(invoice.customer_details.email || order.customer_id.email, 350, doc.y + 5)
               .text(invoice.customer_details.address || order.delivery_address, 350, doc.y + 5);

            doc.moveDown(3);

            // Items Table Header
            const tableTop = doc.y;
            doc.fontSize(10)
               .fillColor('#ffffff')
               .rect(50, tableTop, 500, 25)
               .fill('#1e40af');
           
            doc.text('Item', 60, tableTop + 8)
               .text('Quantity', 250, tableTop + 8)
               .text('Unit Price', 350, tableTop + 8)
               .text('Total', 450, tableTop + 8);

            // Items
            let itemsY = tableTop + 25;
            doc.fillColor('#000000');
           
            order.items.forEach((item, index) => {
                const productName = item.product_id?.name || 'Product';
                const quantity = item.quantity;
                const unitPrice = item.price_at_time;
                const total = item.total_price;

                // Alternate row colors
                if (index % 2 === 0) {
                    doc.rect(50, itemsY, 500, 30)
                       .fillColor('#f3f4f6')
                       .fill()
                       .fillColor('#000000');
                }

                doc.fontSize(9)
                   .text(productName, 60, itemsY + 10, { width: 180 })
                   .text(quantity.toString(), 250, itemsY + 10)
                   .text(`$${unitPrice.toFixed(2)}`, 350, itemsY + 10)
                   .text(`$${total.toFixed(2)}`, 450, itemsY + 10);

                itemsY += 30;
            });

            // Totals
            const totalsY = itemsY + 20;
            doc.fontSize(10)
               .fillColor('#000000');

            // Subtotal
            doc.text('Subtotal:', 350, totalsY)
               .text(`$${invoice.subtotal.toFixed(2)}`, 450, totalsY);

            // Shipping
            if (order.shipping_cost > 0) {
                doc.text('Shipping:', 350, totalsY + 20)
                   .text(`$${order.shipping_cost.toFixed(2)}`, 450, totalsY + 20);
            }

            // Tax
            if (invoice.tax > 0) {
                doc.text('Tax:', 350, totalsY + 40)
                   .text(`$${invoice.tax.toFixed(2)}`, 450, totalsY + 40);
            }

            // Discount
            if (invoice.discount_amount > 0) {
                doc.text('Discount:', 350, totalsY + 60)
                   .text(`-$${invoice.discount_amount.toFixed(2)}`, 450, totalsY + 60);
            }

            // Total
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('Total:', 350, totalsY + 90)
               .text(`$${invoice.total_amount.toFixed(2)}`, 450, totalsY + 90);

            // Footer
            doc.fontSize(8)
               .fillColor('#666666')
               .font('Helvetica')
               .text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' })
               .text('This is an automatically generated invoice.', 50, doc.y + 5, { align: 'center' });

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(relativePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateInvoicePDF
};
