import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { useCart } from "../context/CartContext";

function normalizeValue(v) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  if (typeof v === "object") {
    if (v.name) return v.name;
    return JSON.stringify(v);
  }
  return String(v);
}

function getFromRaw(raw, key) {
  if (!raw || typeof raw !== "object") return undefined;

  const direct = raw[key];
  if (direct !== undefined) return direct;

  if (raw.specs && raw.specs[key] !== undefined) return raw.specs[key];
  if (raw.specifications && raw.specifications[key] !== undefined) return raw.specifications[key];
  if (raw.properties && raw.properties[key] !== undefined) return raw.properties[key];

  return undefined;
}

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addToCart } = useCart();

  const [onlyDiff, setOnlyDiff] = useState(false);
  const [status, setStatus] = useState(""); 

  const products = items ?? [];
  const rows = useMemo(() => {
    const baseRows = [
      { label: "Name", get: (p) => p.name },
      { label: "Price", get: (p) => p.price },
      { label: "Brand", get: (p) => p.brand || p.raw?.brand },
      { label: "Category", get: (p) => p.category || p.raw?.category?.name || p.raw?.category },
      { label: "Stock", get: (p) => p.raw?.quantity },
      { label: "Views", get: (p) => p.raw?.view_count },
      { label: "Discount", get: (p) => p.raw?.active_discount?.discount_rate },
      { label: "Description", get: (p) => p.raw?.description },
    ];

    const extraKeys = new Set();
    for (const p of products) {
      const raw = p.raw;
      const candidates = [
        raw?.specs,
        raw?.specifications,
        raw?.properties,
      ].filter(Boolean);

      for (const obj of candidates) {
        Object.keys(obj).forEach((k) => extraKeys.add(k));
      }
    }

    const blocked = new Set(["name", "title", "price", "brand", "category", "quantity", "view_count", "active_discount", "description"]);
    const extraRows = Array.from(extraKeys)
      .filter((k) => !blocked.has(k))
      .slice(0, 25) 
      .map((k) => ({
        label: k
          .replaceAll("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        get: (p) => getFromRaw(p.raw, k),
      }));

    return [...baseRows, ...extraRows];
  }, [products]);

  const filteredRows = useMemo(() => {
    if (!onlyDiff) return rows;

    return rows.filter((row) => {
      const values = products.map((p) => normalizeValue(row.get(p)));
      return new Set(values).size > 1;
    });
  }, [onlyDiff, rows, products]);

  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
        <p className="mt-2 text-gray-600">Select at least 2 products to compare.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white hover:opacity-90"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const handleAddToCart = async (productId) => {
    setStatus("");
    try {
      const res = await addToCart(productId, 1);
      if (res?.success) {
        setStatus("Added to cart ✅");
        setTimeout(() => setStatus(""), 1500);
      } else {
        setStatus(res?.error || "Could not add to cart.");
      }
    } catch (e) {
      setStatus(e?.message || "Could not add to cart.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
          <p className="text-sm text-gray-600">{products.length} selected</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={onlyDiff}
              onChange={(e) => setOnlyDiff(e.target.checked)}
            />
            Only show differences
          </label>

          <button
            onClick={clear}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear all
          </button>

          <Link
            to="/products"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Back to Products
          </Link>
        </div>
      </div>

      {status && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
          {status}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-white p-4 text-left text-sm font-semibold text-gray-900">
                Field
              </th>

              {products.map((p) => (
                <th key={String(p._id)} className="p-4 align-top">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-28 w-28 overflow-hidden rounded-lg bg-gray-100">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>

                    <div className="text-center text-sm font-semibold text-gray-900 line-clamp-2">
                      {p.name}
                    </div>

                    <div className="text-lg font-bold text-gray-900">
                      ${Number(p.price || 0).toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleAddToCart(p._id)}
                      className="w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Add to cart
                    </button>

                    <button
                      onClick={() => remove(p._id)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                <td className="sticky left-0 z-10 bg-white p-4 text-sm font-semibold text-gray-800">
                  {row.label}
                </td>

                {products.map((p) => {
                  const val = normalizeValue(row.get(p));

                  return (
                    <td key={String(p._id) + row.label} className="p-4 text-sm text-gray-700">
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
}
