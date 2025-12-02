import { useState } from "react";

export default function DiscountForm(){
  const [skus, setSkus] = useState("");   // comma-separated
  const [percent, setPercent] = useState("");

  function onSubmit(e){
    e.preventDefault();
    const list = skus.split(",").map(s=>s.trim()).filter(Boolean);
    console.log("[DISCOUNT] will call API:", { skus: list, percent: Number(percent) });
    alert("Discount form submitted (frontend only). Connect API to apply.");
    setPercent("");
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Discount</h3>
      <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4">
        <input
          className="px-3 py-2 border border-gray-300 rounded-md"
          placeholder="SKUs (comma-separated)"
          value={skus} onChange={e=>setSkus(e.target.value)} required
        />
        <input
          className="px-3 py-2 border border-gray-300 rounded-md"
          type="number" min="0" max="100" placeholder="%"
          value={percent} onChange={e=>setPercent(e.target.value)} required
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Apply
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        * Frontend-only. Implement POST /discounts/apply for real action.
      </p>
    </div>
  );
}
