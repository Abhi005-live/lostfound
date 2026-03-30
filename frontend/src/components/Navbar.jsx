import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const user = JSON.parse(localStorage.getItem("user") || "null")

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/")
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        🔍 Lost &amp; Found
      </Link>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/report-lost">Report Lost</Link>
        <Link to="/report-found">Report Found</Link>
        {user?.role === "admin" && (
          <Link to="/admin" style={{ color: "#f59e0b", fontWeight: 700 }}>⚙ Admin</Link>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-user" ref={dropdownRef} onClick={() => setOpen(o => !o)} title={`Logged in as ${user?.username}`}>
          <div className="avatar">{user?.username?.[0] || "U"}</div>
          <span className="username-label">{user?.username}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>▾</span>

          {open && (
            <div className="dropdown">
              <div className="dropdown-header">
                <p>{user?.username}</p>
                <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={`badge ${user?.role === "admin" ? "badge-lost" : "badge-found"}`} style={{ fontSize: 10 }}>
                    {user?.role === "admin" ? "⚙️ Admin" : "👤 User"}
                  </span>
                  ID: {user?.id}
                </p>
              </div>
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate("/dashboard") }}>
                📋 Dashboard
              </button>
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate("/report-lost") }}>
                📍 Report Lost
              </button>
              <button className="dropdown-item" onClick={() => { setOpen(false); navigate("/report-found") }}>
                📦 Report Found
              </button>
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
