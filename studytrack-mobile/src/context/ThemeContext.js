/**
 * ThemeContext
 *
 * 4 tema: pink (varsayılan) · purple · blue · green
 * Seçilen tema @studytrack_theme anahtarıyla AsyncStorage'da saklanır.
 * Tüm ekranlar useTheme() hook'u ile { theme, themeKey, setTheme, THEMES_LIST } alır.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@studytrack_theme'

// ── Tema tanımları ────────────────────────────────────────────────────────────
export const THEMES = {
  pink: {
    key:   'pink',
    label: 'Pembe',
    emoji: '🌸',
    // Ana marka renkleri
    primary:      '#e91e8c',
    primaryDark:  '#c2185b',
    secondary:    '#7b1fa2',
    secondaryLight: '#ba68c8',
    // Arka planlar
    background:    '#fce4ec',
    backgroundMid: '#f8e8ff',
    // Kart / yüzey
    surface: 'rgba(255, 255, 255, 0.92)',
    // Metin
    text:      '#4a0020',
    textMuted: '#880e4f',
    textLight: '#f06292',
    // Yumuşak tint (pembe tonları)
    soft50:     '#fce4ec',
    soft100:    '#f8bbd0',
    softBorder: '#f8bbd9',
    // Vurgu tint (mor tonları)
    accent50:  '#f3e5f5',
    accent100: '#e1bee7',
  },
  purple: {
    key:   'purple',
    label: 'Mor',
    emoji: '💜',
    primary:      '#7b1fa2',
    primaryDark:  '#4a148c',
    secondary:    '#4a148c',
    secondaryLight: '#9c27b0',
    background:    '#f3e5f5',
    backgroundMid: '#ede7f6',
    surface: 'rgba(255, 255, 255, 0.92)',
    text:      '#2a0040',
    textMuted: '#4a148c',
    textLight: '#ab47bc',
    soft50:     '#f3e5f5',
    soft100:    '#e1bee7',
    softBorder: '#ce93d8',
    accent50:  '#ede7f6',
    accent100: '#d1c4e9',
  },
  blue: {
    key:   'blue',
    label: 'Mavi',
    emoji: '💙',
    primary:      '#1565c0',
    primaryDark:  '#0d47a1',
    secondary:    '#0d47a1',
    secondaryLight: '#1976d2',
    background:    '#e3f2fd',
    backgroundMid: '#e8eaf6',
    surface: 'rgba(255, 255, 255, 0.92)',
    text:      '#0a1929',
    textMuted: '#0d47a1',
    textLight: '#42a5f5',
    soft50:     '#e3f2fd',
    soft100:    '#bbdefb',
    softBorder: '#90caf9',
    accent50:  '#e8eaf6',
    accent100: '#c5cae9',
  },
  green: {
    key:   'green',
    label: 'Yeşil',
    emoji: '💚',
    primary:      '#2e7d32',
    primaryDark:  '#1b5e20',
    secondary:    '#1b5e20',
    secondaryLight: '#388e3c',
    background:    '#e8f5e9',
    backgroundMid: '#f1f8e9',
    surface: 'rgba(255, 255, 255, 0.92)',
    text:      '#0a2a0c',
    textMuted: '#1b5e20',
    textLight: '#66bb6a',
    soft50:     '#e8f5e9',
    soft100:    '#c8e6c9',
    softBorder: '#a5d6a7',
    accent50:  '#f1f8e9',
    accent100: '#dcedc8',
  },
}

export const THEMES_LIST = Object.values(THEMES)

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState('pink') // varsayılan pembe

  // Uygulama açılışında AsyncStorage'dan yükle
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v && THEMES[v]) setThemeKey(v) })
      .catch(() => {})
  }, [])

  // Yeni tema seç + AsyncStorage'a kaydet
  const setTheme = async (key) => {
    if (!THEMES[key]) return
    setThemeKey(key)
    try { await AsyncStorage.setItem(STORAGE_KEY, key) } catch {}
  }

  return (
    <ThemeContext.Provider value={{
      theme:      THEMES[themeKey],
      themeKey,
      setTheme,
      THEMES_LIST,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalıdır')
  return ctx
}

export default ThemeContext
