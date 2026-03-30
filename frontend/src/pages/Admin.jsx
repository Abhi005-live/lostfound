import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../services/api"

function EditItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    title: item.title || "",
    description: item.description || "",
    location: item.location || "",
    type: item.type || "lost",
    date: item.date || ""
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    try {
      const res = await API.put(`/items/${item.id}`, form)
      onSave(res.data)
    } catch {
      alert("Failed to update item")
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Item #{item.id}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("items")
  const [stats, setStats] = useState(null)
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [editItem, setEditItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem("user") || "null")

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [statsRes, itemsRes, usersRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/items"),
        API.get("/admin/users")
      ])
      setStats(statsRes.data)
      setItems(itemsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)))
      setUsers(usersRes.data)
    } catch {
      alert("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return
    await API.delete(`/admin/items/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
    setStats(s => ({ ...s, totalItems: s.totalItems - 1 }))
  }

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return
    await API.delete(`/admin/users/${id}`)
    setUsers(prev => prev.filter(u => u.id !== id))
    setStats(s => ({ ...s, totalUsers: s.totalUsers - 1 }))
  }

  const makeAdmin = async (id) => {
    if (!confirm("Promote this user to admin?")) return
    const res = await API.put(`/admin/users/${id}/make-admin`)
    setUsers(prev => prev.map(u => u.id === id ? res.data : u))
  }

  const onItemSaved = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setEditItem(null)
  }

  return (
    <div>
      <Navbar />
      {editItem && <EditItemModal item={editItem} onSave={onItemSaved} onClose={() => setEditItem(null)} />}

      <div className="page">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2>⚙️ Admin Panel</h2>
            <p>Manage all items and users · {items.length} item{items.length !== 1 ? "s" : ""}, {users.length} user{users.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-icon total">📋</div>
              <div className="stat-info"><p>{stats.totalItems}</p><p>Total Items</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon lost">🔴</div>
              <div className="stat-info"><p>{stats.lostItems}</p><p>Lost</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon found">🟢</div>
              <div className="stat-info"><p>{stats.foundItems}</p><p>Found</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon total">👥</div>
              <div className="stat-info"><p>{stats.totalUsers}</p><p>Users</p></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>
            📦 Items ({items.length})
          </button>
          <button className={`admin-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
            👥 Users ({users.length})
          </button>
          <button className={`admin-tab ${tab === "chats" ? "active" : ""}`} onClick={() => setTab("chats")}>
            💬 Monitor Chats
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><span className="empty-icon">⏳</span><h3>Loading...</h3></div>
        ) : tab === "items" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Coordinates</th>
                  <th>Date</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><span className="table-id">#{item.id}</span></td>
                    <td><span className="table-title">{item.title}</span></td>
                    <td><span className={`badge badge-${item.type}`}>{item.type}</span></td>
                    <td>{item.location || "—"}</td>
                    <td>
                      {item.latitude && item.longitude ? (
                        <a href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer" className="map-link">
                          📍 {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
                        </a>
                      ) : "—"}
                    </td>
                    <td>{item.date || "—"}</td>
                    <td>
                      {item.image
                        ? <img src={item.image} alt="" className="table-thumb" />
                        : <span className="table-no-img">No image</span>
                      }
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setEditItem(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "chats" ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Item ID</th><th>Title</th><th>Action</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><span className="table-id">#{item.id}</span></td>
                    <td>{item.title}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/chat/${item.id}/0`)}>
                        💬 View Chats
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td><span className="table-id">#{user.id}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                        {user.username}
                        {user.id === currentUser?.id && <span className="badge badge-found" style={{ fontSize: 10 }}>You</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === "admin" ? "badge-lost" : "badge-found"}`}>
                        {user.role === "admin" ? "⚙️ Admin" : "👤 User"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {user.role !== "admin" && (
                          <button className="btn btn-outline btn-sm" onClick={() => makeAdmin(user.id)}>⬆️ Make Admin</button>
                        )}
                        {user.id !== currentUser?.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>🗑️ Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
