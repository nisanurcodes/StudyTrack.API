import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import StyledInput from '../components/StyledInput'
import StyledButton from '../components/StyledButton'
import Colors from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { apiLogin } from '../api/auth'

const DECORATIONS = ['✨', '🌸', '📚', '⭐', '🎀', '💫']

export default function LoginScreen({ navigation }) {
  const { login }  = useAuth()
  const { theme }  = useTheme()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  // fieldErrors: input altındaki kırmızı mesajlar
  const [fieldErrors, setFieldErrors] = useState({})
  // globalError: kartın üstündeki genel hata banner'ı
  const [globalError, setGlobalError] = useState('')

  // ── Form doğrulama ──────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email = 'E-posta zorunludur'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Geçerli bir e-posta gir'
    if (!form.password) errs.password = 'Şifre zorunludur'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const clearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: null }))
    setGlobalError('')
  }

  // ── Giriş isteği ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return

    setLoading(true)
    setGlobalError('')

    try {
      const { token, user } = await apiLogin(form.email, form.password)
      // AuthContext token'ı AsyncStorage'a kaydeder ve isAuthenticated=true yapar
      // AppNavigator otomatik olarak MainTabs'a yönlendirir
      await login(token, user)
    } catch (err) {
      // apiLogin Türkçe mesajla fırlatır
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dekoratif arka plan emojileri */}
          {DECORATIONS.map((emoji, i) => (
            <Text
              key={i}
              style={[
                styles.decoration,
                {
                  top: `${10 + ((i * 14) % 70)}%`,
                  left: `${5 + ((i * 17) % 85)}%`,
                },
              ]}
            >
              {emoji}
            </Text>
          ))}

          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>📚</Text>
            <Text style={[styles.logoTitle, { color: theme.primaryDark }]}>StudyTrack</Text>
            <Text style={styles.logoSubtitle}>Hedeflerine doğru adım at! 🌟</Text>
          </View>

          {/* Kart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tekrar hoş geldin~ 👋</Text>

            {/* Genel hata banner'ı */}
            {globalError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>💔 {globalError}</Text>
              </View>
            ) : null}

            <StyledInput
              label="📧 E-posta"
              placeholder="ornek@mail.com"
              value={form.email}
              onChangeText={(t) => {
                setForm((f) => ({ ...f, email: t }))
                clearError('email')
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldErrors.email}
            />

            <StyledInput
              label="🔒 Şifre"
              placeholder="••••••••"
              value={form.password}
              onChangeText={(t) => {
                setForm((f) => ({ ...f, password: t }))
                clearError('password')
              }}
              secureTextEntry
              error={fieldErrors.password}
            />

            <StyledButton
              title="Giriş Yap 🌸"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.switchLink}
              disabled={loading}
            >
              <Text style={styles.switchLinkText}>
                Hesabın yok mu?{' '}
                <Text style={styles.switchLinkBold}>Kayıt ol</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  decoration: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.3,
  },
  // ── Logo ──
  logoArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 38,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  logoSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  // ── Kart ──
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(244, 143, 177, 0.28)',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  // ── Hata banner ──
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  // ── Buton ──
  submitButton: {
    marginTop: 8,
    width: '100%',
  },
  // ── Alt link ──
  switchLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchLinkText: {
    color: Colors.secondary,
    fontSize: 14,
  },
  switchLinkBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
})
