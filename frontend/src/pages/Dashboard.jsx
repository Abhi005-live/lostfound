import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import ItemCard from "../components/ItemCard"
import API from "../services/api"

function Dashboard() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (typeFilter !== "all") params.type = typeFilter
    setLoading(true)
    API.get("/items", { params })
      .then(res => {
        const sorted = [...res.data].sort((a, b) => new Date(b.date) - new Date(a.date))
        setItems(sorted)
      })
      .catch(() => alert("Failed to load items"))
      .finally(() => setLoading(false))
  }, [search, typeFilter])

  const total = items.length
  const lostCount = items.filter(i => i.type === "lost").length
  const foundCount = items.filter(i => i.type === "found").length

  return (
    <div>
      <Navbar />
      <div className="page">

        <div className="page-header">
          <h2>Lost &amp; Found Dashboard</h2>
          <p>Browse all reported items — most recent first</p>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon total">📋</div>
            <div className="stat-info">
              <p>{total}</p>
              <p>Total Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon lost">🔴</div>
            <div className="stat-info">
              <p>{lostCount}</p>
              <p>Lost Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon found">🟢</div>
            <div className="stat-info">
              <p>{foundCount}</p>
              <p>Found Items</p>
            </div>
          </div>
        </div>

        <div className="filters">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {["all", "lost", "found"].map(tab => (
              <button
                key={tab}
                className={`filter-tab ${typeFilter === tab ? "active" : ""}`}
                onClick={() => setTypeFilter(tab)}
              >
                {tab === "all" ? "All" : tab === "lost" ? "🔴 Lost" : "🟢 Found"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="items-grid">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="skeleton-card">
                <div className="skeleton" style={{ height: 190 }} />
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ height: 18, width: "70%" }} />
                  <div className="skeleton" style={{ height: 13, width: "90%" }} />
                  <div className="skeleton" style={{ height: 13, width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="items-grid">
            {items.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3>No items found</h3>
                <p>Try a different search or filter, or report a new item.</p>
              </div>
            ) : (
              items.map(item => <ItemCard key={item.id} item={item} />)
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard
