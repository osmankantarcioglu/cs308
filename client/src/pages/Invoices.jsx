import { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Invoices(){
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to)   q.set("to", to);
      const res = await fetch(`${API_BASE_URL}/invoices${q.toString() ? `?${q}` : ""}`);
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Failed to fetch");
      const list = (data?.data || data) || [];
      setRows(list.map((r, i)=>({
        id: r.id || r._id || i,
        number: r.number, customer: r.customer, total: r.total, date: r.date
      })));
    }catch(err){ setError(err.message); setRows([]); }
    finally{ setLoading(false); }
  }, [from, to]);

  useEffect(()=>{ load(); }, [load]);

  function exportCsv(){
    if(!rows.length) return;
    const header = ["number","customer","total","date"];
    const lines = rows.map(r => [r.number, r.customer, r.total, r.date].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf(){
    if(!rows.length) return;
    const doc = new jsPDF(); doc.text("Invoices", 14, 16);
    let y=26; rows.forEach(r=>{ doc.text(`${r.number} | ${r.customer} | ${r.total} | ${r.date}`,14,y); y+=8; if(y>280){doc.addPage(); y=20;}});
    doc.save("invoices.pdf");
  }

  if (loading){
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error){
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Invoices</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={load} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-600">View, filter and export invoices.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"/>
            </div>
            <button onClick={load} className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-primary transition">
              Filter
            </button>

            <div className="md:ml-auto flex gap-2">
              <button onClick={exportCsv} disabled={!rows.length}
                className={`px-4 py-3 text-sm border rounded-lg ${rows.length ? "border-gray-300" : "opacity-50 cursor-not-allowed"}`}>
                Export CSV
              </button>
              <button onClick={exportPdf} disabled={!rows.length}
                className={`px-4 py-3 text-sm border rounded-lg ${rows.length ? "border-gray-300" : "opacity-50 cursor-not-allowed"}`}>
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">Try another date range.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map(r=>(
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{r.number}</td>
                      <td className="px-6 py-4">{r.customer}</td>
                      <td className="px-6 py-4">${Number(r.total).toFixed(2)}</td>
                      <td className="px-6 py-4">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
