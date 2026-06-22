import axios from 'axios'
import { Preferences } from '@capacitor/preferences'
const API_BASE = '你后端链接/api'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

// request.interceptors.request.use(
//   config => {
//     const token = localStorage.getItem('token')
//     if (token) config.headers.Authorization = `Bearer ${token}`
//     return config
//   },
//   error => Promise.reject(error)
// )
request.interceptors.request.use(
  async config => { // 🚨 加上 async
    // 🚨 改为从 Capacitor 的原生存储中获取
    const { value: token } = await Preferences.get({ key: 'token' }) 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function post(url, data) { return request.post(url, data) }
export function get(url, params) { return request.get(url, { params }) }
export function put(url, data) { return request.put(url, data) }
export function del(url) { return request.delete(url) }

export async function fetchStream(url, data, onChunk, onError, onComplete) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  try {
    const response = await fetch(`${API_BASE}/travel/${url}`, {
      method: 'POST', headers, body: JSON.stringify(data), signal: controller.signal
    })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter(line => line.trim())
      for (const line of lines) {
        try {
          if (line.startsWith('data: ')) {
            const jsonData = JSON.parse(line.substring(6))
            if (jsonData.type === 'chunk') onChunk(jsonData.content)
            else if (jsonData.done) onComplete(jsonData.data)
            else if (jsonData.error) onError(jsonData.error)
          }
        } catch { onError('Stream parse error') }
      }
    }
    onComplete()
    controller.abort()
  } catch (error) {
    onError(error.message)
  }
}
