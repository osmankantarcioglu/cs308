// client/src/lib/invoiceApi.js
import { generateInvoicePdf } from "./invoicePdf";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * orderId: backend'deki order/invoice id
 * invoice: ek bilgiler (customer, items vs.)
 * email: kullanıcı e-postası (genelde login user'dan gelir)
 */
export async function sendInvoiceEmail({ orderId, invoice, email }) {
  // 1) PDF'i client tarafında üret (opsiyonel ama güzel)
  const doc = generateInvoicePdf(invoice);
  const pdfBlob = doc.output("blob");

  // Blob -> base64
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  uint8.forEach(b => (binary += String.fromCharCode(b)));
  const base64Pdf = btoa(binary);

  // 2) Backend'e isteği gönder
  const res = await fetch(`${API_BASE_URL}/invoices/${orderId}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      pdfBase64: base64Pdf,
      filename: `invoice-${invoice.number || orderId}.pdf`,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || "Failed to send invoice email";
    throw new Error(msg);
  }

  return data; // { success: true, ... } gibi bir şey bekliyoruz
}
