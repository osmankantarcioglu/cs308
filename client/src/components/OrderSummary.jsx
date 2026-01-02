import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function OrderSummary({ items, onCheckout }) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // Coupon state
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount_rate, discount_amount }
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved coupon 
  useEffect(() => {
    const saved = localStorage.getItem("appliedCoupon");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.code) {
        setCoupon(parsed);
        setCode(parsed.code);
      }
    } catch {
      // ignore
    }
  }, []);

  // Revalidate saved coupon when subtotal changes
  useEffect(() => {
    if (!coupon?.code) return;

    (async () => {
      try {
        const r = await fetch(
          `${API_BASE_URL}/coupons/validate?code=${encodeURIComponent(
            coupon.code
          )}&subtotal=${subtotal}`
        );
        const data = await r.json();

        if (data?.valid) {
          const updated = {
            code: data.coupon.code,
            discount_rate: data.coupon.discount_rate,
            discount_amount: data.discount_amount,
          };
          setCoupon(updated);
          localStorage.setItem("appliedCoupon", JSON.stringify(updated));
        } else {
          setCoupon(null);
          localStorage.removeItem("appliedCoupon");
        }
      } catch {
        // ignore
      }
    })();
  }, [subtotal]);

  const discountAmount = coupon?.discount_amount ? Number(coupon.discount_amount) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Recompute based on discounted subtotal
  const shipping = discountedSubtotal > 100 ? 0 : 15;
  const tax = (discountedSubtotal + shipping) * 0.08; // 8% tax
  const total = discountedSubtotal + shipping + tax;

  const applyCoupon = async () => {
    setMsg("");
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE_URL}/coupons/validate?code=${encodeURIComponent(
          trimmed
        )}&subtotal=${subtotal}`
      );
      const data = await r.json();

      if (data?.valid) {
        const applied = {
          code: data.coupon.code,
          discount_rate: data.coupon.discount_rate,
          discount_amount: data.discount_amount,
        };
        setCoupon(applied);
        localStorage.setItem("appliedCoupon", JSON.stringify(applied));
        setMsg(`Applied ${applied.code} ✅`);
      } else {
        setCoupon(null);
        localStorage.removeItem("appliedCoupon");
        setMsg(data?.message || "Invalid coupon code.");
      }
    } catch (e) {
      setMsg("Could not validate coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCode("");
    setMsg("");
    localStorage.removeItem("appliedCoupon");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

      {/* Coupon */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-900 mb-2">Coupon / Discount code</div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code (e.g. WELCOME10)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {!coupon ? (
            <button
              onClick={applyCoupon}
              disabled={loading || !code.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Apply"}
            </button>
          ) : (
            <button
              onClick={removeCoupon}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Remove
            </button>
          )}
        </div>

        {msg && <div className="mt-2 text-xs text-gray-600">{msg}</div>}

        {coupon && (
          <div className="mt-2 text-xs text-green-700">
            {coupon.code} ({coupon.discount_rate}% off) applied
          </div>
        )}
      </div>

      {/* Summary Items */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {coupon && (
          <div className="flex justify-between text-green-700">
            <span>Discount ({coupon.code})</span>
            <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Free Shipping Message */}
      {shipping > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            Add{" "}
            <span className="font-semibold">
              ${(100 - discountedSubtotal).toFixed(2)}
            </span>{" "}
            more to get FREE shipping! 🚚
          </p>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
      >
        Proceed to Checkout
      </button>

      {/* Security & Payment Info */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>All payment methods accepted</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Easy returns within 30 days</span>
        </div>
      </div>
    </div>
  );
}
