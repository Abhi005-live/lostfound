import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../services/api"

function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!username || !password) return alert("Enter username and password")
    setLoading(true)
    try {
      await API.post("/auth/register", { username, password })
      alert("Account created! Please sign in.")
      navigate("/")
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === "Enter") handleRegister() }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">✨</span>
          <h1>Lost &amp; Found</h1>
          <p>Join thousands helping each other</p>
        </div>

        <h2>Create account</h2>
        <p className="subtitle">Start reporting and finding lost items today</p>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? "⏳ Creating account..." : "Create Account →"}
        </button>

        <div className="auth-divider" />

        <div className="auth-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
