/**
 * Auth API katmanı  — Study.API (deployed: studytrack-api-nu1x.onrender.com)
 *
 * POST /api/Auth/login    → { email, password }
 *                         ← { message, token, user: { id, name, email } }
 *
 * POST /api/Auth/register → { name, email, password }
 *                         ← { message, user }
 */

import axios from 'axios'
import { API_BASE_URL } from '../constants'

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000,
})

// ── Hata mesajlarını Türkçe'ye çevir ───────────────────────────────────────
function parseAuthError(err) {
  if (err.code === 'ECONNABORTED') {
    return 'Sunucu uyku modundan uyanıyor, lütfen 30 saniye sonra tekrar dene ⏳'
  }
  if (err.code === 'ERR_NETWORK') {
    return 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol et 🤔'
  }

  const status = err.response?.status
  const serverMsg =
    err.response?.data?.message ||
    err.response?.data?.Message ||
    err.response?.data?.title ||
    null

  switch (status) {
    case 400: return serverMsg || 'Gönderilen bilgiler hatalı, lütfen kontrol et.'
    case 401: return 'E-posta veya şifre hatalı 🥺'
    case 404: return 'Kullanıcı bulunamadı.'
    case 409: return serverMsg || 'Bu e-posta adresi zaten kayıtlı 😕'
    case 500: return 'Sunucuda bir hata oluştu, daha sonra tekrar dene.'
    default:  return serverMsg || 'Beklenmeyen bir hata oluştu, tekrar dene!'
  }
}

// ── Login ───────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  console.log('[AUTH] Login →', `${API_BASE_URL}/Auth/login`)

  let response
  try {
    response = await authClient.post('/Auth/login', { email, password })
    console.log('[AUTH] ✅ Login başarılı, status:', response.status)
    console.log('[AUTH] Response keys:', Object.keys(response.data || {}))
  } catch (err) {
    console.warn('[AUTH] ❌ Login hatası:', {
      code:       err.code,
      message:    err.message,
      httpStatus: err.response?.status,
      httpData:   err.response?.data,
      baseURL:    err.config?.baseURL,
      url:        err.config?.url,
    })
    throw new Error(parseAuthError(err))
  }

  // Backend: { message, token, user: { id, name, email, password } }
  const token =
    response.data?.token ||
    response.data?.Token ||
    response.data?.accessToken ||
    null

  if (!token) {
    console.warn('[AUTH] ⚠️ Token bulunamadı. Tüm data:', response.data)
    throw new Error('Sunucudan token alınamadı. Lütfen tekrar deneyin.')
  }

  // user.name tek alan (örn: "Nisa Nur")
  const name = response.data?.user?.name || response.data?.user?.Name || ''
  const user = {
    email:       response.data?.user?.email || email,
    name,
    displayName: name || email.split('@')[0],
  }

  console.log('[AUTH] Kullanıcı:', user.displayName)
  return { token, user }
}

// ── Register ────────────────────────────────────────────────────────────────
// Backend RegisterDto: { name, email, password }
export async function apiRegister(name, email, password) {
  console.log('[AUTH] Register →', `${API_BASE_URL}/Auth/register`)
  console.log('[AUTH] Body:', { name, email, password: '***' })

  try {
    const response = await authClient.post('/Auth/register', { name, email, password })
    console.log('[AUTH] ✅ Register başarılı, status:', response.status)
  } catch (err) {
    console.warn('[AUTH] ❌ Register hatası:', {
      code:       err.code,
      message:    err.message,
      httpStatus: err.response?.status,
      httpData:   err.response?.data,
    })
    throw new Error(parseAuthError(err))
  }
}
