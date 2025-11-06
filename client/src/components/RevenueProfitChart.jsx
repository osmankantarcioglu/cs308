import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export default function RevenueProfitChart({ data = [] }){
  if (!data.length) {
    return (
      <div className="h-80 bg-white rounded-lg shadow p-4 flex items-center justify-center text-gray-500">
        No data. Connect GET /stats/revenue-profit to display charts.
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-80 bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Revenue</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-80 bg-white rounded-lg shadow p-4">
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
  );
}
