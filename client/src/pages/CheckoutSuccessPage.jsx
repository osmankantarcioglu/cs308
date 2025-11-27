import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
//import { downloadInvoicePdf } from "../lib/invoicePdf";
import { generateInvoicePdf, downloadInvoicePdf } from "../lib/invoicePdf";



const API_BASE_URL = "http://localhost:3000/orders";

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { fetchCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const completeOrder = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('Invalid session');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/complete-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete order');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const baseOrder = data.data; 
  
          let finalOrder = baseOrder;
          try {
            const detailsResp = await fetch(
              `${API_BASE_URL}/${baseOrder._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
  
            if (detailsResp.ok) {
              const detailsData = await detailsResp.json();
              if (detailsData.success && detailsData.data) {
                finalOrder = detailsData.data;
              }
            }
          } catch (e) {
            console.error("Failed to fetch full order details", e);
          }
  
          console.log(
            "ORDER USED FOR INVOICE ===>",
            JSON.stringify(finalOrder, null, 2)
          );
  
          setOrder(finalOrder);
          await fetchCart();
        } else {
          throw new Error("Failed to create order");
        }
      } catch (err) {
        console.error("Error completing order:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    completeOrder();
  }, [searchParams, token, fetchCart]);

  async function handleDownloadInvoice() {
    if (!order) return;
    console.log("ORDER USED FOR INVOICE ===>", order);
  
    const subtotal = order.subtotal || 0;
    const totalTaxAmount = order.tax_amount || 0;
    const totalDiscountAmount = order.discount_amount || 0;
  
    const taxRate =
      subtotal > 0 ? (totalTaxAmount / subtotal) * 100 : 0;
    const discountRate =
      subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;
  
    const taxRateRounded = Math.round(taxRate * 100) / 100;
    const discountRateRounded = Math.round(discountRate * 100) / 100;
  
    // ---- 2) ITEMS ----
    const rawItems = order.items || [];
  
    const items = rawItems.map((it) => {
      const product = it.product_id || {};
  
      return {
        name: product.name || it.name || "Item",
        quantity: it.quantity || 1,
        price: it.price_at_time ?? product.price ?? 0,
        tax: taxRateRounded,        
        discount: discountRateRounded, 
      };
    });
  
    // ---- 3) CUSTOMER ----
    const customer = order.customer_id || {};
    const customerName =
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      "Customer";
  
    const customerEmail = customer.email || "";
    const customerAddress = order.delivery_address || "";
  
    // ---- 4) INVOICE PAYLOAD ----
    const payload = {
      company: {
        name: "TechHub Store",
        address: "Orta Mah. Kampus Cd. Sabanci Universitesi\nTuzla / Istanbul",
        phone: "+90 (216) 123 45 67",
        email: "support@cs308-techhub.com",
        website: "cs308-techhub.com",
        taxId: "Tax ID: 1234567890",
        bank: "IBAN: TR12 3456 7890 1234 5678 9012 34",
      },
      customer: {
        name: customerName,
        company: "",
        address: customerAddress,
        phone: "",
        email: customerEmail,
        taxId: "",
      },
      invoice: {
        label: "Invoice",
        number: order.order_number || order._id || "1",
        date: order.order_date
          ? new Date(order.order_date).toLocaleDateString("en-US")
          : undefined,
        dueDate: undefined,
        status: order.payment_status || "completed",
        locale: "en-US",
        currency: "USD",
        orderDiscount: order.discount_amount || 0,
        fee: order.shipping_cost || 0,
        taxAmount: order.tax_amount || 0,
        subtotal: order.subtotal || 0,
      },
      items,
      note:
        "Thank you for your purchase! This invoice was generated for the CS308 project.",
      qr: null,
    };
  
    /*downloadInvoicePdf(
      payload,
      `invoice-${order.order_number || order._id || "order"}.pdf`
    );*/

    const filename = `invoice-${order.order_number || order._id || "order"}.pdf`;
  downloadInvoicePdf(payload, filename);

  try {
    const doc = generateInvoicePdf(payload);

    // datauristring → "data:application/pdf;base64,...."
    const dataUri = doc.output("datauristring");
    const pdfBase64 = dataUri.split(",")[1]; 

    const response = await fetch("http://localhost:3000/email/send-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify({
        orderId: order._id,
        pdfBase64,
      }),
    });

    const resData = await response.json();
    console.log("EMAIL API RESPONSE ===>", resData);

    if (!response.ok) {
      console.error("Email sending failed:", resData);
    }
  } catch (err) {
    console.error("Error while sending invoice email:", err);
  }
    }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Failed</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            to="/basket"
            className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Success Message */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successful!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase</p>
          
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-xl font-bold text-primary">{order.order_number}</p>
            </div>
          )}
          
          <div className="space-y-3 text-left mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Payment confirmed</p>
                <p className="text-sm text-gray-600">Your payment has been processed successfully</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Confirmation email sent</p>
                <p className="text-sm text-gray-600">Check your email for order details</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Preparing for shipment</p>
                <p className="text-sm text-gray-600">Expected delivery in 2-3 business days</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadInvoice}
              className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              Download Invoice PDF
            </button>

            <Link
              to="/profile"
              className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              View Order Details
            </Link>
            <Link
              to="/products"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>We'll process your order and prepare it for shipment</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>You'll receive tracking information via email once shipped</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>Track your order status anytime from your profile page</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>After delivery, you can leave a review for your purchased products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

