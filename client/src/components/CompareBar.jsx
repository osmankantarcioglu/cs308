import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";

export default function CompareBar() {
  const navigate = useNavigate();
  const { items, remove, clear, MAX_COMPARE } = useCompare();
  const [open, setOpen] = useState(false); 

  if (!items || items.length === 0) return null;

  return (
    <>
      {/* Minimal edge tab */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          fixed right-0 top-1/2 -translate-y-1/2 z-[9999]
          h-12 w-10
          rounded-l-xl
          bg-primary text-white
          shadow-lg
          flex items-center justify-center
          hover:opacity-90
        "
        title={open ? "Hide compare" : "Show compare"}
        aria-label={open ? "Hide compare" : "Show compare"}
      >
        {/* Arrow */}
        <span className="text-lg leading-none">{open ? "›" : "‹"}</span>

        {/* Count badge */}
        <span
          className="
            absolute -left-2 -top-2
            min-w-[22px] h-[22px]
            rounded-full
            bg-orange-600
            text-xs font-bold
            flex items-center justify-center
            px-1
          "
        >
          {items.length}
        </span>
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-20 right-4 z-[9998]
          w-80 max-w-[90vw]
          rounded-2xl border border-gray-200 bg-white shadow-xl
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-[120%]"}
        `}
        style={{ paddingBottom: "92px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <div className="text-base font-bold text-gray-900">Compare</div>
            <div className="text-xs text-gray-500">
              {items.length}/{MAX_COMPARE} selected
            </div>
          </div>

          <button
            onClick={clear}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        {/* List */}
        <div className="max-h-[55vh] overflow-auto p-3">
          <ul className="space-y-2">
            {items.map((p) => (
              <li
                key={String(p._id)}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                {/* Image */}
                <div className="h-12 w-12 overflow-hidden rounded-lg bg-white">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    ${Number(p.price || 0).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => remove(p._id)}
                  className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {items.length < 2 && (
            <div className="mt-3 rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800">
              Select at least <b>2</b> products to compare.
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
          <button
            onClick={() => navigate("/compare")}
            disabled={items.length < 2}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${
              items.length < 2
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:opacity-90"
            }`}
          >
            Compare Selected Products
          </button>

          <div className="mt-2 text-center text-xs text-gray-500">
            You can compare up to {MAX_COMPARE} products.
          </div>
        </div>
      </div>
    </>
  );
}
