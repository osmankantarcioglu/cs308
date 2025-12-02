import jsPDF from "jspdf";

export default function InvoicesTable({ rows = [] }){
  const hasData = rows.length > 0;

  function exportCsv(){
    if(!hasData) return;
    const header = ["number","customer","total","date"];
    const lines = rows.map(r => [r.number, r.customer, r.total, r.date].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf(){
    if(!hasData) return;
    const doc = new jsPDF();
    doc.text("Invoices", 14, 16);
    let y = 26;
    rows.forEach(r=>{
      doc.text(`${r.number} | ${r.customer} | ${r.total} | ${r.date}`, 14, y);
      y += 8; if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save("invoices.pdf");
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold">Invoice List</h3>
        <div className="flex gap-2">
          <button
            className={`px-3 py-2 border rounded-md ${hasData ? "border-gray-300" : "opacity-50 cursor-not-allowed"}`}
            onClick={exportCsv}
            disabled={!hasData}
          >Export CSV</button>
          <button
            className={`px-3 py-2 border rounded-md ${hasData ? "border-gray-300" : "opacity-50 cursor-not-allowed"}`}
            onClick={exportPdf}
            disabled={!hasData}
          >Export PDF</button>
        </div>
      </div>

      {hasData ? (
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
                  <td className="px-6 py-4">${r.total}</td>
                  <td className="px-6 py-4">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-gray-600">
          No data. Connect GET /invoices to populate this table.
        </div>
      )}
    </div>
  );
}
