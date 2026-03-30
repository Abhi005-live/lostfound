import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Client } from "@stomp/stompjs"
import Navbar from "../components/Navbar"
import API from "../services/api"

// ── E2E Encryption helpers (AES-GCM via Web Crypto) ──────────────────────────
// The shared secret is derived from the itemId — both parties use the same key.
// Admin can decrypt all messages since they know the itemId too.
async function getKey(itemId) {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(("lostfound-" + itemId).padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
  return raw
}

async function encrypt(text, itemId) {
  const key = await getKey(itemId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(b64, itemId) {
  try {
    const key = await getKey(itemId)
    const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const cipher = combined.slice(12)
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch {
    return "🔒 [encrypted]"
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function Chat() {
  const { itemId, receiverId } = useParams()
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  const [messages, setMessages] = useState([])
  const [decrypted, setDecrypted] = useState({})
  const [input, setInput] = useState("")
  const [item, setItem] = useState(null)
  const [receiverName, setReceiverName] = useState("Reporter")
  const bottomRef = useRef(null)
  const stompRef = useRef(null)

  useEffect(() => {
    API.get(`/items/${itemId}`).then(r => setItem(r.data)).catch(() => {})
    loadMessages()
    connectWS()
    return () => stompRef.current?.deactivate()
  }, [itemId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await API.get(`/chat/${itemId}`)
      setMessages(res.data)
      decryptAll(res.data)
    } catch {}
  }

  const decryptAll = async (msgs) => {
    const map = {}
    for (const m of msgs) {
      map[m.id] = await decrypt(m.encryptedContent, itemId)
    }
    setDecrypted(map)
  }

  const connectWS = () => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/websocket",
      onConnect: () => {
        client.subscribe(`/topic/chat/${itemId}`, async (frame) => {
          const msg = JSON.parse(frame.body)
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          const plain = await decrypt(msg.encryptedContent, itemId)
          setDecrypted(prev => ({ ...prev, [msg.id]: plain }))
        })
      },
      reconnectDelay: 3000,
    })
    client.activate()
    stompRef.current = client
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const encryptedContent = await encrypt(input.trim(), itemId)
    try {
      await API.post("/chat/send", {
        itemId: Number(itemId),
        receiverId: Number(receiverId),
        encryptedContent
      })
      setInput("")
    } catch {
      alert("Failed to send message")
    }
  }

  const isAdmin = currentUser?.role === "admin"

  return (
    <div style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(`/item/${itemId}`)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>←</button>
          <div>
            <h3 style={{ margin: 0 }}>
              {isAdmin ? "👁️ Admin View — " : "💬 Chat about: "}
              {item?.title || `Item #${itemId}`}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              {isAdmin ? "All messages visible to admin only" : "End-to-end encrypted · Identity hidden"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          background: "#fff", borderRadius: 12, padding: 16,
          minHeight: 400, maxHeight: 500, overflowY: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 16
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#9ca3af", marginTop: 80 }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <p>No messages yet. Start the conversation.</p>
              <p style={{ fontSize: 12 }}>Messages are end-to-end encrypted</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.senderId === currentUser?.id
            return (
              <div key={msg.id} style={{
                display: "flex", justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: 12
              }}>
                <div style={{
                  maxWidth: "70%", padding: "10px 14px", borderRadius: 12,
                  background: isMine ? "#4f46e5" : "#f3f4f6",
                  color: isMine ? "#fff" : "#1f2937",
                  fontSize: 14
                }}>
                  {!isMine && (
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
                      {isAdmin ? msg.senderName : "Anonymous"}
                    </div>
                  )}
                  <div>{decrypted[msg.id] || "🔒 decrypting..."}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isAdmin && (
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value.slice(0, 300))}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message... (End-to-end encrypted)"
                maxLength={300}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  border: "1px solid #d1d5db", outline: "none", fontSize: 14
                }}
              />
              <button onClick={sendMessage} style={{
                background: "#4f46e5", color: "#fff", border: "none",
                borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontWeight: 600
              }}>Send 🔒</button>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right" }}>{input.length}/300</div>
          </div>
        )}
        {isAdmin && (
          <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, padding: 12,
            background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            👁️ Admin read-only view — all conversations are visible to you
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
