import { useState } from "react";

export default function PriceForm(){
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");

  function onSubmit(e){
    e.preventDefault();
    console.log("[PRICE] will call API:", { sku, price: Number(price) });
    alert("Price form submitted (frontend only). Connect API to persist.");
    setPrice("");
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Price</h3>
      <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4">
        <input
          className="px-3 py-2 border border-gray-300 rounded-md"
          placeholder="SKU"
          value={sku}
          onChange={e=>setSku(e.target.value)}
          required
        />
        <input
          className="px-3 py-2 border border-gray-300 rounded-md"
          type="number" step="0.01" placeholder="New price"
          value={price} onChange={e=>setPrice(e.target.value)} required
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Save
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        * This is frontend-only. Implement POST /pricing to persist.
      </p>
    </div>
  );
}
