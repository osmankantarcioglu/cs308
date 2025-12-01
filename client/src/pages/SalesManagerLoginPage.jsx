import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SalesManagerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.user) {
        if (result.user.role === "sales_manager") {
          navigate("/sales/dashboard", { replace: true });
        } else {
          setError("Access denied. Sales manager credentials required.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } else {
        throw new Error(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-sky-950 py-16 px-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6">
        {/* Story / Brand side */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-emerald-500/20 p-10 text-white shadow-2xl shadow-emerald-900/40">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
            Revenue Control Center
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Sales Manager Access
          </h1>
          <p className="text-emerald-100 leading-relaxed">
            Tune pricing strategy, launch discounts, and keep a real-time pulse on
            invoices, revenue, and profit. Designed for data‑driven sales leaders.
          </p>

          <div className="mt-10 space-y-4 text-sm text-emerald-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 3v18h18"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M7 14l4-5 4 3 5-7"
                  />
                </svg>
              </div>
              <p>Visualize revenue and margin trends over time</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 10h18M7 6h10M9 14h6m-9 4h12"
                  />
                </svg>
              </div>
              <p>Control discounts on key product groups</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M5 7h14M5 12h14M5 17h7"
                  />
                </svg>
              </div>
              <p>Explore invoices by time period and export as PDF</p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8c1.657 0 3-1.567 3-3.5S13.657 1 12 1 9 2.567 9 4.5 10.343 8 12 8zm0 0c-3.314 0-6 2.686-6 6v4h12v-4c0-3.314-2.686-6-6-6z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sales Manager Login</h2>
            <p className="text-slate-500 text-sm mt-1">Authorized sales team only</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-2xl flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14"
                  />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="sales-email" className="block text-sm font-semibold text-slate-600 mb-2">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="sales-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="you@sales-team.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sales-password" className="block text-sm font-semibold text-slate-600 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="sales-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-sky-600 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Validating..." : "Sign in to Revenue Console"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              ← Back to storefront
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


