import { useState, useRef, useEffect } from "react"

function ImageCapture({ image, onChange }) {
  const [mode, setMode] = useState("idle") // idle | camera | preview
  const [stream, setStream] = useState(null)
  const [error, setCameraError] = useState("")
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (mode === "camera") startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [mode])

  const startCamera = async () => {
    setCameraError("")
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permission or upload a file.")
      setMode("idle")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    onChange(dataUrl)
    setMode("preview")
    stopCamera()
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(ev.target.result)
      setMode("preview")
    }
    reader.readAsDataURL(file)
  }

  const clear = () => {
    onChange("")
    setMode("idle")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="image-capture">
      {mode === "idle" && !image && (
        <div className="capture-placeholder">
          <span className="capture-icon">📷</span>
          <p>Add a photo of the item</p>
          <div className="capture-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode("camera")}>
              📸 Open Camera
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              🖼️ Upload File
            </button>
          </div>
          {error && <p className="capture-error">{error}</p>}
        </div>
      )}

      {mode === "camera" && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <div className="camera-modal-header">
              <span>📸 Camera</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("idle")}>✕ Close</button>
            </div>
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <div className="camera-modal-footer">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("idle")}>Cancel</button>
              <button type="button" className="capture-shutter" onClick={capture}>📷</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {image && (
        <div className="capture-preview">
          <img src={image} alt="Captured" className="capture-img" />
          <div className="capture-preview-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("camera")}>
              🔄 Retake
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              🖼️ Change
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={clear}>
              🗑️ Remove
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  )
}

export default ImageCapture
