// client/src/pages/OrderSuccess.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sendInvoiceEmail } from "../lib/invoiceApi";
import { generateInvoicePdf } from "../lib/invoicePdf";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrderSuccessPage() {
  const { orderId } = useParams();          // /order-success/:orderId gibi
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | success | error
  const [emailError, setEmailError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userEmail = user?.email;

  // 1) Invoice detaylarını çek
  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to load invoice");
        setInvoice(data.data || data); // backend formatına göre
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [orderId]);

 

  // 2) ilk defa invoice yüklendiğinde otomatik e-mail
  useEffect(() => {
    if (!invoice || !userEmail) return;
    // aynı sayfayı refresh ederken 10 kez yollamasın diye guard:
    if (emailStatus !== "idle") return;

    async function autoSendEmail() {
      setEmailStatus("sending");
      try {
        await sendInvoiceEmail({
          orderId,
          invoice,
          email: userEmail,
        });
        setEmailStatus("success");
      } catch (err) {
        console.error(err);
        setEmailStatus("error");
        setEmailError(err.message);
      }
    }

    autoSendEmail();
  }, [invoice, userEmail, orderId, emailStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Could not load invoice.</p>
      </div>
    );
  }

  function handleDownloadPdf() {
    const doc = generateInvoicePdf(invoice);
    doc.save(`invoice-${invoice.number || orderId}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Your order has been placed. Below is your invoice.
        </p>

        {/* Basit invoice gösterimi */}
        <div className="border rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-3 text-sm text-gray-700">
            <span>Invoice No: <strong>{invoice.number}</strong></span>
            <span>Date: {invoice.date}</span>
          </div>

          <div className="mb-3 text-sm text-gray-700">
            <div>Customer: {invoice.customer?.name}</div>
            <div>Email: {invoice.customer?.email}</div>
            <div>Address: {invoice.customer?.address}</div>
          </div>

          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Price</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((it, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-1">{it.name}</td>
                  <td className="py-1 text-right">{it.qty}</td>
                  <td className="py-1 text-right">${Number(it.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end text-sm font-semibold">
            Total:&nbsp;${Number(invoice.total).toFixed(2)}
          </div>
        </div>

        {/* Email status + actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm">
            {emailStatus === "sending" && (
              <span className="text-gray-600">Sending invoice to your email...</span>
            )}
            {emailStatus === "success" && (
              <span className="text-green-600">
                Invoice email has been sent to <strong>{userEmail}</strong>.
              </span>
            )}
            {emailStatus === "error" && (
              <span className="text-red-600">
                Could not send invoice email. {emailError}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black"
            >
              Download PDF
            </button>
            {emailStatus === "error" && (
              <button
                onClick={() => setEmailStatus("idle")}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Retry Email
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
