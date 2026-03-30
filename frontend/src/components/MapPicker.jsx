import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

function MapPicker({ coords, onCoordsChange, onAddressChange }) {
  const [open, setOpen] = useState(false)
  const [marker, setMarker] = useState(coords.lat ? [coords.lat, coords.lng] : null)
  const [locating, setLocating] = useState(false)
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const searchTimer = useRef(null)

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      const addr = data.address
      const readable = [addr.road, addr.suburb, addr.city || addr.town || addr.village, addr.state]
        .filter(Boolean).join(", ")
      onAddressChange(readable || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      onAddressChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
  }

  const handlePick = async (lat, lng) => {
    setMarker([lat, lng])
    onCoordsChange(lat, lng)
    await reverseGeocode(lat, lng)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported")
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePick(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => { alert("Could not get location"); setLocating(false) }
    )
  }

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSuggestions([]); return }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`)
        setSuggestions(await res.json())
      } catch { setSuggestions([]) }
    }, 400)
  }

  const pickSuggestion = async (s) => {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon)
    setMarker([lat, lng])
    onCoordsChange(lat, lng)
    onAddressChange(s.display_name.split(",").slice(0, 3).join(", "))
    setSearch("")
    setSuggestions([])
  }

  const center = marker || [20.5937, 78.9629] // default: India center

  return (
    <div className="map-picker">
      <div className="map-picker-bar">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(o => !o)}>
          🗺️ {open ? "Hide Map" : "Pick on Map"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation} disabled={locating}>
          {locating ? "⏳" : "📍"} {locating ? "Locating..." : "Use My Location"}
        </button>
        {marker && (
          <span className="coords-chip">
            📌 {marker[0].toFixed(4)}, {marker[1].toFixed(4)}
          </span>
        )}
        {marker && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMarker(null); onCoordsChange(null, null); onAddressChange("") }} title="Clear pin">
            ✕ Clear
          </button>
        )}
      </div>

      {open && (
        <div className="map-container-wrap">
          <div className="map-search-wrap">
            <input
              type="text"
              className="map-search-input"
              placeholder="🔍 Search a place..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="map-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className="map-suggestion-item" onClick={() => pickSuggestion(s)}>
                    📍 {s.display_name.split(",").slice(0, 3).join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="map-hint">Click anywhere on the map to drop a pin</p>
          <MapContainer center={center} zoom={marker ? 15 : 5} className="leaflet-map" key={open}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <ClickHandler onPick={handlePick} />
            {marker && <Marker position={marker} />}
          </MapContainer>
        </div>
      )}
    </div>
  )
}

export default MapPicker
