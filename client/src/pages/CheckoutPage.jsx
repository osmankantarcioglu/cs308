import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/orders";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, appliedCoupon } = useCart(); // Ensure cartItems is destructured here
  const { isAuthenticated, user, token } = useAuth();
  
  const [deliveryAddress, setDeliveryAddress] = useState(user?.home_address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Please login to checkout');
      navigate('/login');
      return;
    }
    
    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      // Allow a small delay or check if data is still loading if needed, 
      // but strictly redirecting here is fine for now.
      // alert('Your cart is empty'); 
      // navigate('/basket');
    }
  }, [isAuthenticated, cartItems, navigate]);

  // --- COUPON LOGIC START ---
  const storedCouponRaw = localStorage.getItem("appliedCoupon"); 
  const storedCoupon = storedCouponRaw ? JSON.parse(storedCouponRaw) : null;

  const coupon = appliedCoupon || storedCoupon; 
  const subtotal = parseFloat(cartTotal) || 0;

  const discountRate = coupon?.discount_rate ? Number(coupon.discount_rate) : 0;
  const minSubtotal = coupon?.min_subtotal ? Number(coupon.min_subtotal) : 0;

  const isCouponEligible =
    coupon?.code &&
    discountRate > 0 &&
    (coupon.is_active === undefined || coupon.is_active === true) &&
    subtotal >= minSubtotal;

  const discountAmount = isCouponEligible ? (subtotal * discountRate) / 100 : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const shipping = discountedSubtotal >= 100 ? 0 : 15; 
  const tax = (discountedSubtotal + shipping) * 0.08; 
  const total = discountedSubtotal + shipping + tax;
  // --- COUPON LOGIC END ---

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems, 
          delivery_address: deliveryAddress,
          coupon_code: coupon?.code || "" 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Delivery Information</h2>
                  <p className="text-white/90 text-sm">Where should we send your order?</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Complete Delivery Address
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="address"
                    rows={4}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address, apartment/suite number, city, state/province, postal code, country"
                    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Please provide your complete address including postal code for accurate delivery
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {/* Coupon */}
              {discountAmount > 0 && coupon?.code && (
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    Coupon
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                      {coupon.code}
                    </span>
                  </span>
                  <span className="font-semibold text-green-700">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {discountedSubtotal < 100 && shipping > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
                  💡 Add ${(100 - discountedSubtotal).toFixed(2)} more for FREE shipping!
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-2">📦 {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your order</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Secure Payment with Stripe</p>
                <p className="text-sm text-gray-600">You'll be redirected to Stripe's secure checkout</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 font-bold text-lg rounded-lg transition-all ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg"
              }`}
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>

            {/* Security Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>All payment methods</span>
              </div>
            </div>
          </div>

          {/* Back to Cart */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/basket')}
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}