// client/src/pages/LoginPage.jsx
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000" // istersen .env ile değiştir

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("admin@sabanciuniv.edu")
  const [password, setPassword] = useState("cs308")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.message || data.error || "Login failed"
        throw new Error(msg)
      }

      const token = data?.data?.token
      const user = data?.data?.user

      if (!token || !user) {
        throw new Error("Geçersiz cevap: token veya kullanıcı bilgisi yok")
      }

      // token & user kaydet
      localStorage.setItem("authToken", token)
      localStorage.setItem("user", JSON.stringify(user))

      const role = (user.role || "").toLowerCase()

      if (role === "admin") {
        navigate("/admin")
      } else {
        navigate("/")
      }
    } catch (err) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl px-8 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">CS308 Store</h1>
            <p className="mt-2 text-sm text-slate-500">
              Lütfen hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@sabanciuniv.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="cs308"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Admin için hazır:{" "}
            <span className="font-mono text-slate-300">
              admin@sabanciuniv.edu / cs308
            </span>
          </p>

          <p className="mt-4 text-center text-sm text-slate-500">
            Hesabın yok mu?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


