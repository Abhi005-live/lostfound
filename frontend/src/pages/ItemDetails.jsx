import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Navbar from "../components/Navbar"
import API from "../services/api"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    API.get(`/items/${id}`)
      .then(res => setItem(res.data))
      .catch(() => setError(true))
  }, [id])

  const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  const isOwner = item && currentUser && item.reportedBy === currentUser.id

  const downloadImage = () => {
    if (!item?.image) return
    const a = document.createElement("a")
    a.href = item.image
    a.download = `${item.title.replace(/\s+/g, "_")}_${item.id}.jpg`
    a.click()
  }

  if (error) return (
    <div>
      <Navbar />
      <div className="page">
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <h3>Item not found</h3>
          <p>This item may have been removed.</p>
          <br />
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  )

  if (!item) return (
    <div>
      <Navbar />
      <div className="page">
        <div className="empty-state">
          <span className="empty-icon">⏳</span>
          <h3>Loading...</h3>
          <p>Fetching item details</p>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="page">

        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
        </div>

        <div className="detail-card">
          {item.image ? (
            <div className="detail-img-wrap">
              <img src={item.image} alt={item.title} className="detail-img" />
              <button className="download-btn" onClick={downloadImage} title="Download image">
                ⬇ Download Photo
              </button>
            </div>
          ) : (
            <div className="detail-img-placeholder">{item.type === "lost" ? "🔴" : "🟢"}</div>
          )}

          <div className="detail-body">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{item.title || "Untitled Item"}</h2>
              <span className={`badge badge-${item.type}`}>
                {item.type === "lost" ? "● Lost" : "● Found"}
              </span>
              {currentUser && !isOwner && (
                <button
                  onClick={() => navigate(`/chat/${item.id}/${item.reportedBy || 1}`)}
                  style={{
                    marginLeft: "auto", background: "#4f46e5", color: "#fff",
                    border: "none", borderRadius: 8, padding: "8px 16px",
                    cursor: "pointer", fontWeight: 600, fontSize: 13
                  }}
                >
                  💬 Contact Reporter
                </button>
              )}
            </div>

            {item.description && (
              <div className="detail-desc">{item.description}</div>
            )}

            <div className="detail-meta">
              <div className="detail-meta-item">
                <div className="meta-label">📍 Location</div>
                <div className="meta-value">{item.location || "—"}</div>
              </div>
              <div className="detail-meta-item">
                <div className="meta-label">📅 Date</div>
                <div className="meta-value">{item.date || "—"}</div>
              </div>
              <div className="detail-meta-item">
                <div className="meta-label">🏷️ Type</div>
                <div className="meta-value" style={{ textTransform: "capitalize" }}>{item.type}</div>
              </div>
              <div className="detail-meta-item">
                <div className="meta-label">🆔 Item ID</div>
                <div className="meta-value">#{item.id}</div>
              </div>
              {item.latitude && item.longitude && (
                <div className="detail-meta-item" style={{ gridColumn: "1 / -1" }}>
                  <div className="meta-label">🗺️ Coordinates</div>
                  <div className="meta-value" style={{ marginBottom: 10 }}>
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}{" "}
                    <a href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 600, fontSize: 13 }}>
                      Open in Google Maps →
                    </a>
                  </div>
                  <MapContainer
                    center={[item.latitude, item.longitude]}
                    zoom={15}
                    className="detail-leaflet-map"
                    zoomControl={true}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[item.latitude, item.longitude]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ItemDetails
