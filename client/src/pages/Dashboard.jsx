import { useEffect, useState, useCallback } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard(){
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try{
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to)   q.set("to", to);
      const res = await fetch(`${API_BASE_URL}/stats/revenue-profit${q.toString() ? `?${q}` : ""}`);
      const body = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Failed to fetch");
      setData(Array.isArray(body) ? body : (body.data || []));
    }catch(err){ setError(err.message); setData([]); }
    finally{ setLoading(false); }
  }, [from, to]);

  useEffect(()=>{ load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales Manager — Dashboard</h1>
          <p className="text-gray-600">Revenue & Profit visualization</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
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
              Calculate
            </button>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-600">Loading stats...</p>
          </div>
        ) : !data.length ? (
          <div className="h-80 bg-white rounded-xl shadow p-6 flex items-center justify-center text-gray-500">
            No data.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Revenue</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-80 bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Profit</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" /><YAxis /><Tooltip />
                  <Bar dataKey="profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
