import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../services/api"

function MyReports() {
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  const [items, setItems] = useState([])
  const [chatCounts, setChatCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMyItems()
  }, [])

  const loadMyItems = async () => {
    try {
      const res = await API.get("/items")
      const mine = res.data.filter(i => i.reportedBy === currentUser?.id)
      setItems(mine)
      // load chat counts for each item
      const counts = {}
      await Promise.all(mine.map(async (item) => {
        try {
          const chatRes = await API.get(`/chat/${item.id}`)
          counts[item.id] = chatRes.data.length
        } catch {
          counts[item.id] = 0
        }
      }))
      setChatCounts(counts)
    } catch {
      alert("Failed to load your reports")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h2>📋 My Reports</h2>
          <p>Items you've reported — see who contacted you and reply</p>
        </div>

        {loading ? (
          <div className="empty-state"><span className="empty-icon">⏳</span><h3>Loading...</h3></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No reports yet</h3>
            <p>You haven't reported any lost or found items.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => navigate("/report-lost")}>Report Lost Item</button>
              <button className="btn btn-primary" style={{ width: "auto", padding: "11px 22px" }} onClick={() => navigate("/report-found")}>Report Found Item</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map(item => (
              <div key={item.id} style={{
                background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 20,
                display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"
              }}>
                {/* Image */}
                {item.image
                  ? <img src={item.image} alt={item.title} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                      {item.type === "lost" ? "🔴" : "🟢"}
                    </div>
                }

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{item.title}</span>
                    <span className={`badge badge-${item.type}`}>{item.type}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {item.location && <span>📍 {item.location} · </span>}
                    <span>📅 {item.date}</span>
                  </div>
                </div>

                {/* Chat button with count */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    View Item
                  </button>
                  <button
                    onClick={() => navigate(`/my-chats/${item.id}`)}
                    style={{
                      position: "relative", background: "#4f46e5", color: "#fff",
                      border: "none", borderRadius: 8, padding: "8px 16px",
                      cursor: "pointer", fontWeight: 600, fontSize: 13,
                      display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    💬 Replies
                    {chatCounts[item.id] > 0 && (
                      <span style={{
                        background: "#ef4444", color: "#fff", borderRadius: "50%",
                        width: 20, height: 20, fontSize: 11, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {chatCounts[item.id]}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReports
