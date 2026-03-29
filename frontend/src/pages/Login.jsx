import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../services/api"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username || !password) return alert("Enter username and password")
    setLoading(true)
    try {
      const res = await API.post("/auth/login", { username, password })
      localStorage.setItem("user", JSON.stringify(res.data))
      navigate("/dashboard")
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin() }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🔍</span>
          <h1>Lost &amp; Found</h1>
          <p>Reuniting people with their belongings</p>
        </div>

        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to your account to continue</p>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "⏳ Signing in..." : "Sign In →"}
        </button>

        <div className="auth-divider" />

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one free</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
