import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setUnauthorizedHandler } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  // loading: uygulama ilk açılışında AsyncStorage okunurken true kalır
  // AppNavigator bu sürede loading ekranı gösterir
  const [loading, setLoading] = useState(true)

  // ── Uygulama açılışında oturumu geri yükle ─────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await AsyncStorage.multiGet(['token', 'user'])
        if (savedToken[1]) setToken(savedToken[1])
        if (savedUser[1]) setUser(JSON.parse(savedUser[1]))
      } catch (err) {
        console.warn('Oturum geri yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  // ── 401 geldiğinde api/axios.js → logout() çağırabilsin ──────────────
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // ── Login: token + kullanıcıyı kaydet, state güncelle ─────────────────
  const login = async (newToken, userData = null) => {
    try {
      const pairs = [['token', newToken]]
      if (userData) pairs.push(['user', JSON.stringify(userData)])
      await AsyncStorage.multiSet(pairs)
      setToken(newToken)
      setUser(userData)
    } catch (err) {
      console.warn('Token kaydedilemedi:', err)
      throw err
    }
  }

  // ── Kullanıcı bilgisini yerel olarak güncelle ─────────────────────────
  // NOT: Backend'de profil güncelleme endpointi yok (PUT /Auth/profile).
  //      Değişiklikler sadece bu cihazda (AsyncStorage) saklanır.
  const updateUser = async (updates) => {
    try {
      const merged = { ...user, ...updates }
      await AsyncStorage.setItem('user', JSON.stringify(merged))
      setUser(merged)
    } catch (err) {
      console.warn('[AUTH] updateUser hatası:', err)
      throw err
    }
  }

  // ── Logout: her şeyi temizle ───────────────────────────────────────────
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user'])
    } catch (err) {
      console.warn('Token silinemedi:', err)
    } finally {
      // State'i her durumda temizle
      setToken(null)
      setUser(null)
    }
  }

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır')
  }
  return context
}

export default AuthContext
