import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Pricing(){
  // Update Price
  const [priceSku, setPriceSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState("");
  const [pOk, setPOk] = useState("");

  async function submitPrice(e){
    e.preventDefault();
    setPError(""); setPOk(""); setPLoading(true);
    try{
      const res = await fetch(`${API_BASE_URL}/pricing`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ sku: priceSku, price: Number(newPrice) })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Price update failed");
      setPOk("Price saved (frontend request sent).");
      setNewPrice("");
    }catch(err){ setPError(err.message); }
    finally{ setPLoading(false); }
  }

  // Apply Discount
  const [discountSkus, setDiscountSkus] = useState(""); // "X-100,X-200"
  const [percent, setPercent] = useState("");
  const [dLoading, setDLoading] = useState(false);
  const [dError, setDError] = useState("");
  const [dOk, setDOk] = useState("");

  async function submitDiscount(e){
    e.preventDefault();
    setDError(""); setDOk(""); setDLoading(true);
    try{
      const skus = discountSkus.split(",").map(s=>s.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE_URL}/discounts/apply`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ skus, percent: Number(percent) })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Discount apply failed");
      setDOk("Discounts applied (frontend request sent).");
      setPercent("");
    }catch(err){ setDError(err.message); }
    finally{ setDLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Price & Discount Management</h1>
          <p className="text-gray-600">Update product prices or apply bulk discounts</p>
        </div>

        {/* Update Price */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Update Price</h3>
          {pError && <p className="mb-3 text-sm text-red-600">{pError}</p>}
          {pOk && <p className="mb-3 text-sm text-green-600">{pOk}</p>}
          <form onSubmit={submitPrice} className="flex flex-col md:flex-row gap-4">
            <input
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="SKU (e.g. X-100)"
              value={priceSku} onChange={e=>setPriceSku(e.target.value)} required
            />
            <input
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              type="number" min="0" step="0.01" placeholder="New price"
              value={newPrice} onChange={e=>setNewPrice(e.target.value)} required
            />
            <button
              disabled={pLoading}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-primary transition disabled:opacity-50"
            >
              {pLoading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        {/* Apply Discount */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Apply Discount</h3>
          {dError && <p className="mb-3 text-sm text-red-600">{dError}</p>}
          {dOk && <p className="mb-3 text-sm text-green-600">{dOk}</p>}
          <form onSubmit={submitDiscount} className="flex flex-col md:flex-row gap-4">
            <input
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="SKUs (comma-separated)"
              value={discountSkus} onChange={e=>setDiscountSkus(e.target.value)} required
            />
            <input
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              type="number" min="0" max="100" placeholder="Discount %"
              value={percent} onChange={e=>setPercent(e.target.value)} required
            />
            <button
              disabled={dLoading}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-primary transition disabled:opacity-50"
            >
              {dLoading ? "Applying..." : "Apply"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            * Backend yoksa error gösterebilir. 
          </p>
        </div>
      </div>
    </div>
  );
}
