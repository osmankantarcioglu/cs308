import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

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
          setOrder(data.data);
          // Refresh cart to show it's empty
          await fetchCart();
        } else {
          throw new Error('Failed to create order');
        }
      } catch (err) {
        console.error('Error completing order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    completeOrder();
  }, [searchParams, token, fetchCart]);

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-xl font-bold text-primary">{order.order_number}</p>
              </div>
              {order.invoice && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                  <p className="text-lg font-semibold text-gray-900">{order.invoice.invoice_number}</p>
                </div>
              )}
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
                <p className="font-semibold text-gray-900">Invoice email sent</p>
                <p className="text-sm text-gray-600">
                  {order?.invoice?.email_sent 
                    ? "Invoice PDF has been sent to your email" 
                    : "Check your email for order details"}
                </p>
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
            {order?.invoice?.pdf_path && (
              <a
                href={`http://localhost:3000${order.invoice.pdf_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View Invoice PDF
              </a>
            )}
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

        {/* Invoice Section */}
        {(order?.invoice || order?.invoice_path) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Invoice</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {order.invoice?.invoice_number && `Invoice #${order.invoice.invoice_number} • `}
                  Total: ${order.total_amount?.toFixed(2)}
                </p>
              </div>
              {(order.invoice?.pdf_path || order.invoice_path) && (
                <a
                  href={`http://localhost:3000${order.invoice?.pdf_path || order.invoice_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View Invoice PDF
                </a>
              )}
            </div>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {(order.invoice?.pdf_path || order.invoice_path) ? (
                <iframe
                  src={`http://localhost:3000${order.invoice?.pdf_path || order.invoice_path}`}
                  className="w-full"
                  style={{ height: '700px' }}
                  title="Invoice PDF"
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>Invoice PDF is being generated. Please refresh the page in a moment.</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Your invoice has been sent to your email. Click "View Invoice PDF" to view or download it.</p>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        {order?.invoice && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-semibold text-gray-900">{order.invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-primary text-lg">${order.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email Status:</span>
                <span className={`font-semibold ${order.invoice.email_sent ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.invoice.email_sent ? 'Sent' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Your invoice has been generated and sent to your email</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>We'll process your order and prepare it for shipment</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>You'll receive tracking information via email once shipped</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p>Track your order status anytime from your profile page</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <p>After delivery, you can leave a review for your purchased products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
