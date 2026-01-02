import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:3000";

export default function CouponsPanel({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    code: "",
    discount_rate: 10,
    min_subtotal: 0,
    expires_at: "",
    is_active: true,
  });

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/admin/coupons`, { headers });
      const data = await r.json();
      setCoupons(data?.data || []);
    } catch (e) {
      console.error(e);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      discount_rate: 10,
      min_subtotal: 0,
      expires_at: "",
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code || "",
      discount_rate: c.discount_rate ?? 10,
      min_subtotal: c.min_subtotal ?? 0,
      expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : "",
      is_active: !!c.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      code: String(form.code || "").trim().toUpperCase(),
      discount_rate: Number(form.discount_rate),
      min_subtotal: Number(form.min_subtotal || 0),
      expires_at: form.expires_at ? form.expires_at : null,
      is_active: !!form.is_active,
    };

    if (!payload.code) return alert("Coupon code is required.");
    if (!Number.isFinite(payload.discount_rate) || payload.discount_rate < 1 || payload.discount_rate > 90) {
      return alert("Discount rate must be between 1 and 90.");
    }
    if (!Number.isFinite(payload.min_subtotal) || payload.min_subtotal < 0) {
      return alert("Min subtotal must be >= 0.");
    }

    try {
      if (editing?._id) {
        await fetch(`${API_BASE_URL}/admin/coupons/${editing._id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_BASE_URL}/admin/coupons`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      alert("Could not save coupon.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
        method: "DELETE",
        headers,
      });
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      alert("Could not delete coupon.");
    }
  };

  const toggleActive = async (c) => {
    try {
      await fetch(`${API_BASE_URL}/admin/coupons/${c._id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      alert("Could not update coupon.");
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">Loading coupons...</div>;
  }

  return (
    <>
      {/* Header / Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Coupons</h2>
          <p className="text-sm text-gray-600">Create and manage coupon codes for customers.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Add New Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Min Subtotal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const statusText = expired ? "Expired" : c.is_active ? "Active" : "Inactive";
                const statusClass =
                  expired
                    ? "bg-gray-100 text-gray-700"
                    : c.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700";

                return (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{c.code}</td>
                    <td className="px-6 py-4 text-gray-700">{c.discount_rate}%</td>
                    <td className="px-6 py-4 text-gray-700">${Number(c.min_subtotal || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {c.expires_at ? String(c.expires_at).slice(0, 10) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 font-medium">
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(c)}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => remove(c._id)} className="text-red-600 hover:text-red-800 font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="font-bold text-gray-900">{editing ? "Edit Coupon" : "Add Coupon"}</div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="WELCOME10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discount %</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={form.discount_rate}
                    onChange={(e) => setForm((s) => ({ ...s, discount_rate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min Subtotal ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_subtotal}
                    onChange={(e) => setForm((s) => ({ ...s, min_subtotal: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expires At</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm((s) => ({ ...s, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <label className="flex items-center gap-2 mt-7 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
