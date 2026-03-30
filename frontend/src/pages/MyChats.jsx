import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Client } from "@stomp/stompjs"
import Navbar from "../components/Navbar"
import API from "../services/api"

async function getKey(itemId) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(("lostfound-" + itemId).padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
  )
}

async function encrypt(text, itemId) {
  const key = await getKey(itemId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text))
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(b64, itemId) {
  try {
    const key = await getKey(itemId)
    const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: combined.slice(0, 12) }, key, combined.slice(12))
    return new TextDecoder().decode(plain)
  } catch { return "🔒 [encrypted]" }
}

function MyChats() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  const [item, setItem] = useState(null)
  const [messages, setMessages] = useState([])
  const [decrypted, setDecrypted] = useState({})
  // group messages by the OTHER person (the enquirer)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [input, setInput] = useState("")
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
  }, [messages, selectedUserId])

  const loadMessages = async () => {
    try {
      const res = await API.get(`/chat/${itemId}`)
      setMessages(res.data)
      const map = {}
      for (const m of res.data) {
        map[m.id] = await decrypt(m.encryptedContent, itemId)
      }
      setDecrypted(map)
    } catch {}
  }

  const connectWS = () => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/websocket",
      onConnect: () => {
        client.subscribe(`/topic/chat/${itemId}`, async (frame) => {
          const msg = JSON.parse(frame.body)
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
          const plain = await decrypt(msg.encryptedContent, itemId)
          setDecrypted(prev => ({ ...prev, [msg.id]: plain }))
        })
      },
      reconnectDelay: 3000,
    })
    client.activate()
    stompRef.current = client
  }

  const sendReply = async () => {
    if (!input.trim() || !selectedUserId) return
    const encryptedContent = await encrypt(input.trim(), itemId)
    try {
      await API.post("/chat/send", {
        itemId: Number(itemId),
        receiverId: Number(selectedUserId),
        encryptedContent
      })
      setInput("")
    } catch { alert("Failed to send reply") }
  }

  // Get unique enquirers (people who messaged the reporter)
  const enquirers = [...new Map(
    messages
      .filter(m => m.senderId !== currentUser?.id)
      .map(m => [m.senderId, { id: m.senderId, name: m.senderName }])
  ).values()]

  // Messages for selected conversation
  const conversation = selectedUserId
    ? messages.filter(m => m.senderId === selectedUserId || m.receiverId === selectedUserId)
    : []

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/my-reports")}>← My Reports</button>
          <div>
            <h2 style={{ margin: 0 }}>💬 Replies for: {item?.title || `Item #${itemId}`}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>End-to-end encrypted · Identities hidden from public</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, height: "calc(100vh - 220px)" }}>

          {/* Left — Enquirers list */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              👥 People who contacted you
            </div>
            {enquirers.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                No one has contacted you yet
              </div>
            ) : (
              enquirers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  style={{
                    padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                    background: selectedUserId === u.id ? "#eef2ff" : "transparent",
                    borderLeft: selectedUserId === u.id ? "3px solid #6366f1" : "3px solid transparent",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    ?
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Anonymous User</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {messages.filter(m => m.senderId === u.id || m.receiverId === u.id).length} messages
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right — Conversation */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!selectedUserId ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#94a3b8", gap: 8 }}>
                <div style={{ fontSize: 48 }}>💬</div>
                <p>Select a conversation to reply</p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                  {conversation.map(msg => {
                    const isMine = msg.senderId === currentUser?.id
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 12 }}>
                        <div style={{
                          maxWidth: "70%", padding: "10px 14px", borderRadius: 12,
                          background: isMine ? "#4f46e5" : "#f3f4f6",
                          color: isMine ? "#fff" : "#1f2937", fontSize: 14
                        }}>
                          {!isMine && (
                            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>Anonymous</div>
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

                {/* Reply input */}
                <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", display: "flex", gap: 10 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendReply()}
                    placeholder="Type your reply... (End-to-end encrypted)"
                    style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid #d1d5db", outline: "none", fontSize: 14 }}
                  />
                  <button onClick={sendReply} style={{
                    background: "#4f46e5", color: "#fff", border: "none",
                    borderRadius: 10, padding: "11px 18px", cursor: "pointer", fontWeight: 600
                  }}>Reply 🔒</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyChats
