import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import ImageCapture from "../components/ImageCapture"
import MapPicker from "../components/MapPicker"
import API from "../services/api"

function ReportFound() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [image, setImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!title && !image && !location) return alert("Please provide at least a title, photo, or location")
    setLoading(true)
    try {
      await API.post("/items", {
        title: title || null,
        description: description || null,
        location: location || null,
        latitude: coords.lat,
        longitude: coords.lng,
        image: image || null,
        type: "found"
      })
      navigate("/dashboard")
    } catch {
      alert("Failed to report item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h2>Report a Found Item</h2>
          <p>All fields are optional — even just a photo helps!</p>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <h2>🟢 Found Item Report</h2>
            <p>Fill in whatever you know — nothing is required</p>
          </div>

          <div className="form-group">
            <label>Item Name <span className="optional-tag">optional</span></label>
            <input type="text" placeholder="e.g. Samsung phone, Keys with red keychain..." value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          </div>

          <div className="form-group">
            <label>Description <span className="optional-tag">optional</span></label>
            <textarea placeholder="Color, brand, size, distinguishing features..." value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
          </div>

          <div className="form-group">
            <label>Location <span className="optional-tag">optional — type, search, or pick on map</span></label>
            <input
              type="text"
              placeholder="e.g. Library 2nd floor, CS Parking..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <MapPicker
              coords={coords}
              onCoordsChange={(lat, lng) => setCoords({ lat, lng })}
              onAddressChange={(addr) => setLocation(addr)}
            />
          </div>

          <div className="form-group">
            <label>Photo <span className="optional-tag">optional</span></label>
            <ImageCapture image={image} onChange={setImage} />
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate("/dashboard")}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "⏳ Submitting..." : "Submit Report →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportFound
