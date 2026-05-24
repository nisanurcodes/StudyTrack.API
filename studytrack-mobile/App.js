// ⚠️ En üstte — gesture-handler global nesneleri hazırlaması için zorunlu
import 'react-native-gesture-handler'

import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider } from './src/context/ThemeContext'
import AppNavigator from './src/navigation/AppNavigator'

/**
 * Sarmalama sırası (dıştan içe):
 *
 *  GestureHandlerRootView   ← gesture-handler için zorunlu (en dış katman)
 *    SafeAreaProvider       ← safe area inset'lerini hesaplar (StatusBar, home indicator vb.)
 *      ThemeProvider        ← tema renk sistemi (AsyncStorage'dan yüklenir)
 *        AuthProvider       ← JWT token yönetimi
 *          AppNavigator     ← ekran yönlendirme
 *
 * SafeAreaProvider olmadan:
 *   - useSafeAreaInsets() hook'ları 0 döner
 *   - Tab bar height yanlış hesaplanır
 *   - Android'de StatusBar layout'u kayar → dokunma alanları görüntüyle uyuşmaz
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* translucent kaldırıldı: SafeAreaProvider'sız translucent Android'de
            tüm layout'u status bar yüksekliği kadar yukarı kaydırır */}
        <StatusBar style="dark" />
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
