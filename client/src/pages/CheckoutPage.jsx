import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const orderTotal = state?.total ?? 0;

  const [form, setForm] = useState({
    fullName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingAddress: "",
    city: "",
    country: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.fullName || !form.cardNumber || !form.expiry || !form.cvv) {
      alert("Please fill in all required card details.");
      return;
    }

    alert("Payment successful! (Mock payment – UI only)");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Checkout
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Complete your purchase by providing your payment details.
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs text-gray-500">
            Secure • Mock payment UI
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="md:col-span-2 space-y-4"
            noValidate
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={form.cardNumber}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (MM/YY)
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  placeholder="12/27"
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="password"
                  name="cvv"
                  value={form.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Address
              </label>
              <textarea
                name="billingAddress"
                value={form.billingAddress}
                onChange={handleChange}
                rows={3}
                placeholder="Street name, building number, apartment"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
              <Link
                to="/basket"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Cart
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
              >
                Pay Now
              </button>
            </div>
          </form>

          <aside className="md:col-span-1 border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Summary
            </h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">
              This is a mock payment user interface. Real credit card
              verification and bank integration are out of scope for this
              project.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
