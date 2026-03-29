import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ReportLost from "./pages/ReportLost"
import ReportFound from "./pages/ReportFound"
import ItemDetails from "./pages/ItemDetails"
import Admin from "./pages/Admin"
import Chat from "./pages/Chat"

function PrivateRoute({ children }) {
  const user = localStorage.getItem("user")
  return user ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null")
  if (!user) return <Navigate to="/" replace />
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const user = localStorage.getItem("user")
  return user ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/report-lost" element={<PrivateRoute><ReportLost /></PrivateRoute>} />
        <Route path="/report-found" element={<PrivateRoute><ReportFound /></PrivateRoute>} />
        <Route path="/item/:id" element={<PrivateRoute><ItemDetails /></PrivateRoute>} />
        <Route path="/chat/:itemId/:receiverId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
