// client/src/lib/invoicePdf.js
import jsPDF from "jspdf";

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ü/g, "u").replace(/Ü/g, "U");
}

const safe = (v) => normalizeText(v);

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function calcSubTotal(items) {
  return items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
}

function calcTax(items) {
  return items.reduce(
    (sum, it) =>
      sum +
      (it.tax ? ((it.price || 0) * (it.quantity || 0) * it.tax) / 100 : 0),
    0
  );
}

function calcDiscount(items) {
  return items.reduce(
    (sum, it) =>
      sum +
      (it.discount
        ? ((it.price || 0) * (it.quantity || 0) * it.discount) / 100
        : 0),
    0
  );
}

function calcFinalTotal(items, orderDiscount = 0, fee = 0) {
  const sub = calcSubTotal(items);
  const tax = calcTax(items);
  const disc = calcDiscount(items) + (orderDiscount || 0);
  return sub + tax + fee - disc;
}

/**
 * payload:
 * {
 *   company: {...},
 *   customer: {...},
 *   invoice: {...},
 *   items: [...],
 *   note?: string
 * }
 */
export function generateInvoicePdf(payload) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const COLOR_PRIMARY = "#3b82f6";        // --color-primary
  const COLOR_PRIMARY_DARK = "#2563eb";   // --color-primary-dark
  const COLOR_SECONDARY = "#8b5cf6";      // --color-secondary
  const TEXT_DARK = "#111827";            // text-gray-900 
  const GRAY_LINE = "#E5E7EB";            // border-gray-200
  const TABLE_HEADER_BG = "#F3F4F6";      // gray-100

  const {
    company = {},
    customer = {},
    invoice = {},
    items = [],
    note,
  } = payload;

  const currency = (invoice.currency || "USD").toUpperCase();

  const leftWidth = contentWidth * 0.6;
  const rightX = margin + leftWidth + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(safe(company.name || "TechHub Store"), margin, y);

  doc.setFontSize(22);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text(safe(invoice.label || "INVOICE"), pageWidth - margin, y, {
    align: "right",
  });

  y += 8;
  doc.setDrawColor(GRAY_LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);

  const leftStartY = y;
  let leftY = leftStartY;

  if (company.address) {
    const addr = doc.splitTextToSize(safe(company.address), leftWidth);
    doc.text(addr, margin, leftY);
    leftY += addr.length * 5;
  }
  if (company.phone) {
    doc.text(safe(company.phone), margin, leftY);
    leftY += 5;
  }
  if (company.email) {
    doc.text(safe(company.email), margin, leftY);
    leftY += 5;
  }
  if (company.website) {
    doc.text(safe(company.website), margin, leftY);
    leftY += 5;
  }
  if (company.taxId) {
    doc.text(safe(company.taxId), margin, leftY);
    leftY += 5;
  }
  if (company.bank) {
    doc.text(safe(company.bank), margin, leftY);
    leftY += 5;
  }

  let rightY = leftStartY;
  const today = new Date().toLocaleDateString("en-US");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_DARK);
  doc.text(`Ref no: #${invoice.number || 1}`, rightX, rightY);
  rightY += 5;

  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${invoice.date || today}`, rightX, rightY);
  rightY += 5;

  doc.text(`Due date: ${invoice.dueDate || today}`, rightX, rightY);
  rightY += 5;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_PRIMARY_DARK);
  doc.text(`Status: ${invoice.status || "Pending"}`, rightX, rightY);

  y = Math.max(leftY, rightY) + 12;

  // ===== BILL TO =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_SECONDARY);
  doc.text("Bill To", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);

  if (customer.name) {
    doc.text(safe(customer.name), margin, y);
    y += 5;
  }
  if (customer.company) {
    doc.text(safe(customer.company), margin, y);
    y += 5;
  }
  if (customer.address) {
    const caddr = doc.splitTextToSize(safe(customer.address), contentWidth);
    doc.text(caddr, margin, y);
    y += caddr.length * 5;
  }
  if (customer.phone) {
    doc.text(safe(customer.phone), margin, y);
    y += 5;
  }
  if (customer.email) {
    doc.text(safe(customer.email), margin, y);
    y += 5;
  }
  if (customer.taxId) {
    doc.text(safe(customer.taxId), margin, y);
    y += 5;
  }

  y += 6;

  // ===== ITEMS TABLE =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(TEXT_DARK);
  doc.text("Items", margin, y);
  y += 4;

  const headerHeight = 8;
  const rowHeight = 7;

  const colItemX = margin + 2;
  const colQtyX = margin + contentWidth * 0.40;
  const colPriceX = margin + contentWidth * 0.55;
  const colTaxX = margin + contentWidth * 0.68;
  const colDiscX = margin + contentWidth * 0.80;
  const colTotalX = margin + contentWidth * 0.93;

  doc.setFillColor(TABLE_HEADER_BG);
  doc.rect(margin, y, contentWidth, headerHeight, "F");
  doc.setFontSize(10);
  doc.setTextColor("#4B5563"); 

  doc.text("Item", colItemX, y + 5);
  doc.text("Qty", colQtyX, y + 5);
  doc.text("Price", colPriceX, y + 5);
  doc.text("Tax", colTaxX, y + 5);
  doc.text("Disc.", colDiscX, y + 5);
  doc.text("Total", colTotalX, y + 5, { align: "right" });

  y += headerHeight;
  doc.setTextColor(TEXT_DARK);
  doc.setFont("helvetica", "normal");

  if (!items.length) {
    y += rowHeight;
    doc.text("No items.", colItemX, y);
    y += rowHeight;
  } else {
    items.forEach((item) => {
      const itemName = safe(item.name || "Item");
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const tax = item.tax || 0;
      const discount = item.discount || 0;

      const baseTotal = price * qty;
      const taxAmount = tax ? (baseTotal * tax) / 100 : 0;
      const discAmount = discount ? (baseTotal * discount) / 100 : 0;
      const lineTotal = baseTotal + taxAmount - discAmount;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      y += rowHeight;

      const maxItemWidth = colQtyX - colItemX - 4;
      const itemLines = doc.splitTextToSize(itemName, maxItemWidth);
      doc.text(itemLines, colItemX, y);

      doc.text(String(qty), colQtyX, y);
      doc.text(formatCurrency(price, currency), colPriceX, y);
      doc.text(tax ? tax + "%" : "-", colTaxX, y);
      doc.text(discount ? discount + "%" : "-", colDiscX, y);
      doc.text(formatCurrency(lineTotal, currency), colTotalX, y, {
        align: "right",
      });

      y += (itemLines.length - 1) * 5;
    });
    y += rowHeight;
  }

  /*const subTotal = calcSubTotal(items);
  const totalTax = calcTax(items);
  const totalDiscount = calcDiscount(items) + (invoice.orderDiscount || 0);
  const fee = invoice.fee || 0;
  const grandTotal = calcFinalTotal(items, invoice.orderDiscount || 0, fee);*/

  const subTotal =
  typeof invoice.subtotal === "number"
    ? invoice.subtotal
    : calcSubTotal(items);

  const totalTax =
    typeof invoice.taxAmount === "number"
      ? invoice.taxAmount
      : calcTax(items);

  const totalDiscount = calcDiscount(items) + (invoice.orderDiscount || 0);
  const fee = invoice.fee || 0;

  // Grand total: sub + tax + fee - discount
  const grandTotal = subTotal + totalTax + fee - totalDiscount;


  doc.setDrawColor(GRAY_LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const totalsXLabel = margin + contentWidth * 0.60;
  const totalsXValue = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK);

  doc.text("Subtotal:", totalsXLabel, y);
  doc.text(formatCurrency(subTotal, currency), totalsXValue, y, {
    align: "right",
  });
  y += 6;

  doc.text("Total Tax:", totalsXLabel, y);
  doc.text(formatCurrency(totalTax, currency), totalsXValue, y, {
    align: "right",
  });
  y += 6;

  if (totalDiscount > 0) {
    doc.text("Total Discount:", totalsXLabel, y);
    doc.text(formatCurrency(totalDiscount, currency), totalsXValue, y, {
      align: "right",
    });
    y += 6;
  }

  if (fee > 0) {
    doc.text("Fee:", totalsXLabel, y);
    doc.text(formatCurrency(fee, currency), totalsXValue, y, {
      align: "right",
    });
    y += 6;
  }

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PRIMARY_DARK);
  doc.text("Grand Total:", totalsXLabel, y);
  doc.text(formatCurrency(grandTotal, currency), totalsXValue, y, {
    align: "right",
  });
  y += 14;

  if (note) {
    const noteLines = doc.splitTextToSize(safe(note), contentWidth);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor("#6B7280");
    doc.text(noteLines, margin, y);
  }

  return doc;
}

export function downloadInvoicePdf(payload, filename = "invoice.pdf") {
  const doc = generateInvoicePdf(payload);
  doc.save(filename);
}
