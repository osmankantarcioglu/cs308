import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// This dashboard is intentionally frontend-only. It uses sample data and does not
// call any APIs so that backend functionality can be wired later.

const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Noise‑Cancelling Headphones", price: 199.99 },
  { id: "p2", name: "4K Ultra HD Monitor", price: 349.0 },
  { id: "p3", name: "Mechanical Keyboard Pro", price: 129.5 },
  { id: "p4", name: "Ergonomic Office Chair", price: 259.99 },
];

const SAMPLE_INVOICES = [
  { id: "inv-1012", customer: "Alice Johnson", total: 329.99, date: "2025-11-01" },
  { id: "inv-1013", customer: "Mark Spencer", total: 149.5, date: "2025-11-02" },
  { id: "inv-1014", customer: "Sofia Lee", total: 799.99, date: "2025-11-05" },
  { id: "inv-1015", customer: "James Carter", total: 219.0, date: "2025-11-09" },
];

const SAMPLE_REVENUE_POINTS = [
  { label: "Mon", revenue: 4200, profit: 2100 },
  { label: "Tue", revenue: 5100, profit: 2550 },
  { label: "Wed", revenue: 3900, profit: 1900 },
  { label: "Thu", revenue: 6100, profit: 3100 },
  { label: "Fri", revenue: 7200, profit: 3600 },
];

export default function SalesManagerDashboard() {
  const { user } = useAuth();

  const [discountRate, setDiscountRate] = useState(10);
  const [selectedProductIds, setSelectedProductIds] = useState(() =>
    SAMPLE_PRODUCTS.slice(0, 2).map((p) => p.id)
  );

  const [invoiceStart, setInvoiceStart] = useState("2025-11-01");
  const [invoiceEnd, setInvoiceEnd] = useState("2025-11-30");

  const [profitStart, setProfitStart] = useState("2025-11-01");
  const [profitEnd, setProfitEnd] = useState("2025-11-30");

  const selectedProducts = SAMPLE_PRODUCTS.filter((p) => selectedProductIds.includes(p.id));

  const discountedProducts = selectedProducts.map((product) => {
    const newPrice = product.price * (1 - discountRate / 100);
    return {
      ...product,
      newPrice,
      savings: product.price - newPrice,
    };
  });

  const filteredInvoices = SAMPLE_INVOICES.filter((invoice) => {
    if (!invoiceStart || !invoiceEnd) return true;
    return invoice.date >= invoiceStart && invoice.date <= invoiceEnd;
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const defaultCost = totalRevenue * 0.5;
  const estimatedProfit = totalRevenue - defaultCost;

  const handleToggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleApplyDiscount = () => {
    // Placeholder for future backend call
    // Here we only show UI feedback via console / visual state if needed
    console.log("Apply discount", {
      discountRate,
      selectedProductIds,
    });
  };

  const handlePrintInvoices = () => {
    // Placeholder for print implementation
    window.print();
  };

  const handleExportInvoices = () => {
    // Placeholder for future PDF export implementation
    console.log("Export invoices between", invoiceStart, "and", invoiceEnd);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <header className="text-white">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">
            Revenue & Pricing Console
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-4xl font-extrabold">Sales Manager Dashboard</h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Configure discounts, scan invoices, and track how pricing decisions impact
                overall revenue and profit. This view is read‑only for now; backend
                actions can be wired later.
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Signed in as</p>
              <p className="text-white font-semibold text-lg">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-emerald-300 text-xs uppercase tracking-[0.3em]">
                Sales Manager
              </p>
            </div>
          </div>
        </header>

        {/* Top KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-emerald-600/90 to-emerald-500/90 rounded-3xl p-6 text-white ring-1 ring-white/10 shadow-2xl shadow-emerald-900/40">
            <p className="text-sm uppercase tracking-widest text-white/70">
              Sample Revenue (range)
            </p>
            <p className="text-4xl font-black mt-3">
              ${totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm mt-2 text-white/80">
              Based on mock invoices between the selected dates
            </p>
          </div>
          <div className="bg-gradient-to-br from-sky-500/90 to-cyan-500/90 rounded-3xl p-6 text-white ring-1 ring-white/10 shadow-2xl shadow-sky-900/40">
            <p className="text-sm uppercase tracking-widest text-white/70">
              Estimated Profit
            </p>
            <p className="text-4xl font-black mt-3">
              ${estimatedProfit.toFixed(2)}
            </p>
            <p className="text-sm mt-2 text-white/80">
              Assuming product cost defaults to 50% of sale price
            </p>
          </div>
          <div className="bg-slate-900/90 rounded-3xl p-6 text-white ring-1 ring-emerald-500/30 shadow-2xl shadow-black/40">
            <p className="text-sm uppercase tracking-widest text-emerald-300/80">
              Active Discount Plan
            </p>
            <p className="text-4xl font-black mt-3">{discountRate}%</p>
            <p className="text-sm mt-2 text-slate-300">
              Applied to {selectedProductIds.length} selected products (UI only)
            </p>
          </div>
        </section>

        {/* Discount configuration + preview */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-white text-2xl font-semibold">Configure Discounts</h2>
                <p className="text-slate-400 text-sm">
                  Select products and set a discount rate. The system will later update
                  prices and notify customers with those items in their wishlist.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">Discount rate</span>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_PRODUCTS.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                const newPrice = product.price * (1 - discountRate / 100);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggleProduct(product.id)}
                    className={`text-left rounded-2xl p-4 border transition-all ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-900/40"
                        : "border-white/5 bg-slate-950/40 hover:border-emerald-400/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{product.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Base price: ${product.price.toFixed(2)}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-400"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-emerald-300">
                        Discounted: ${newPrice.toFixed(2)}
                      </span>
                      <span className="text-slate-400">
                        Save ${(product.price - newPrice).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400 max-w-md">
                When wired to the backend, applying this plan will update product prices
                and trigger notifications for customers whose wishlists contain the
                discounted items.
              </p>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-sky-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl"
              >
                Preview &amp; Apply (UI only)
              </button>
            </div>
          </div>

          {/* Discounted products summary */}
          <div className="bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-4">
            <h3 className="text-white text-xl font-semibold">Discount Preview</h3>
            {discountedProducts.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Select at least one product on the left to preview discount impact.
              </p>
            ) : (
              <div className="space-y-3 text-sm text-slate-200">
                {discountedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950/60 rounded-2xl px-4 py-3 border border-white/5"
                  >
                    <p className="font-semibold text-white">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">
                        Old: ${p.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-emerald-300">
                        New: ${p.newPrice.toFixed(2)} (−${p.savings.toFixed(2)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Invoices + export */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-white text-2xl font-semibold">Invoices</h2>
                <p className="text-slate-400 text-sm">
                  View all invoices within a selected date range. Printing and export are
                  mocked for now.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">From</span>
                  <input
                    type="date"
                    value={invoiceStart}
                    onChange={(e) => setInvoiceStart(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">To</span>
                  <input
                    type="date"
                    value={invoiceEnd}
                    onChange={(e) => setInvoiceEnd(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <p className="text-slate-500 text-sm py-6">
                No sample invoices in the selected date range.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-slate-400">Invoice</p>
                      <p className="text-white font-semibold">{invoice.id}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {invoice.customer} • {invoice.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-300 font-semibold text-lg">
                        ${invoice.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        (Sample data only)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-slate-400">
                Total in range:{" "}
                <span className="text-emerald-300 font-semibold">
                  ${totalRevenue.toFixed(2)}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoices}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
                >
                  Print invoices
                </button>
                <button
                  type="button"
                  onClick={handleExportInvoices}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Save as PDF
                </button>
              </div>
            </div>
          </div>

          {/* Profit & loss chart (static visual) */}
          <div className="bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-white text-xl font-semibold">Revenue vs Profit</h2>
                <p className="text-slate-400 text-sm">
                  Simple sample trend assuming costs are 50% of sales.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                Revenue
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400" />
                Profit
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 h-56 flex items-end gap-3">
              {SAMPLE_REVENUE_POINTS.map((point) => {
                const maxRevenue = Math.max(...SAMPLE_REVENUE_POINTS.map((p) => p.revenue));
                const revenueHeight = (point.revenue / maxRevenue) * 100;
                const profitHeight = (point.profit / maxRevenue) * 100;
                return (
                  <div key={point.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div className="w-full flex items-end justify-center gap-1 h-40">
                      <div
                        className="w-2 rounded-full bg-emerald-400/80"
                        style={{ height: `${revenueHeight}%` }}
                      />
                      <div
                        className="w-2 rounded-full bg-sky-400/80"
                        style={{ height: `${profitHeight}%` }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {point.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-slate-400">
              Date filters for this chart ({profitStart} → {profitEnd}) can be wired to
              real analytics later. For now, it visualizes a static example week.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


