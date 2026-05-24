/**
 * Authenticated API client
 * Login/Register hariç tüm backend istekleri buradan geçer.
 * Her istekte AsyncStorage'dan JWT okunur ve Authorization header'a eklenir.
 */

import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: her isteğe token ekle ─────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: 401'de oturumu kapat ─────────────────────────────
// AuthContext'i burada import edemeyiz (döngüsel bağımlılık).
// Bunun yerine modül seviyesinde bir callback tutuluyor.
let _onUnauthorized = null

/**
 * AuthContext mount olduğunda logout fonksiyonunu kayıt eder.
 * 401 geldiğinde bu callback çağrılır → hem AsyncStorage hem state temizlenir.
 */
export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // AsyncStorage'ı temizle
      await AsyncStorage.multiRemove(['token', 'user'])
      // Eğer handler kayıtlıysa (AuthContext bağlıysa) context state'ini de temizle
      if (_onUnauthorized) {
        _onUnauthorized()
      }
    }
    return Promise.reject(error)
  }
)

export default api
