import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
})

API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem("user") || "null")
  if (user?.id) {
    config.headers["X-User-Id"] = user.id
  }
  return config
})

export default API