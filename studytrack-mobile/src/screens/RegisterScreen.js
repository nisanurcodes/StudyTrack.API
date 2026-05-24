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
import { useTheme } from '../context/ThemeContext'
import { apiRegister } from '../api/auth'

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ── Form doğrulama ──────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}

    if (!form.name.trim())
      errs.name = 'Ad Soyad zorunludur'
    else if (form.name.trim().length < 2)
      errs.name = 'Ad Soyad en az 2 karakter olmalı'

    if (!form.email.trim())
      errs.email = 'E-posta zorunludur'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Geçerli bir e-posta gir'

    if (!form.password)
      errs.password = 'Şifre zorunludur'
    else if (form.password.length < 6)
      errs.password = 'Şifre en az 6 karakter olmalı'

    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Şifreler eşleşmiyor'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const update = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: null }))
    setGlobalError('')
    setSuccessMsg('')
  }

  // ── Kayıt isteği ────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return

    setLoading(true)
    setGlobalError('')
    setSuccessMsg('')

    try {
      await apiRegister(form.name.trim(), form.email.trim(), form.password)
      setSuccessMsg('Hesabın oluşturuldu! 🎉 Giriş sayfasına yönlendiriliyorsun...')
      setTimeout(() => navigation.navigate('Login'), 2000)
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundMid }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🌸</Text>
            <Text style={[styles.logoTitle, { color: theme.secondary }]}>StudyTrack</Text>
            <Text style={styles.logoSubtitle}>Yolculuğuna başla! ✨</Text>
          </View>

          {/* Kart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hesap Oluştur 🎀</Text>

            {globalError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>💔 {globalError}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>✅ {successMsg}</Text>
              </View>
            ) : null}

            <StyledInput
              label="👤 Ad Soyad"
              placeholder="Adın ve soyadın"
              value={form.name}
              onChangeText={update('name')}
              autoCapitalize="words"
              autoCorrect={false}
              error={fieldErrors.name}
            />

            <StyledInput
              label="📧 E-posta"
              placeholder="ornek@mail.com"
              value={form.email}
              onChangeText={update('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldErrors.email}
            />

            <StyledInput
              label="🔒 Şifre"
              placeholder="En az 6 karakter"
              value={form.password}
              onChangeText={update('password')}
              secureTextEntry
              error={fieldErrors.password}
            />

            <StyledInput
              label="🔒 Şifre Tekrar"
              placeholder="Şifreyi tekrar gir"
              value={form.confirmPassword}
              onChangeText={update('confirmPassword')}
              secureTextEntry
              error={fieldErrors.confirmPassword}
            />

            <StyledButton
              title="Kayıt Ol 💖"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || !!successMsg}
              style={[styles.submitButton, { backgroundColor: Colors.secondary }]}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.switchLink}
              disabled={loading}
            >
              <Text style={styles.switchLinkText}>
                Zaten hesabın var mı?{' '}
                <Text style={styles.switchLinkBold}>Giriş yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundGradientMid },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.backgroundGradientMid,
  },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  logoTitle: { fontSize: 36, fontWeight: '700', color: Colors.secondary, marginBottom: 6 },
  logoSubtitle: { fontSize: 14, color: Colors.secondaryLight },
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
    borderColor: Colors.purple100,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorBannerText: { color: Colors.error, fontSize: 14, lineHeight: 20 },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successBannerText: { color: Colors.success, fontSize: 14, lineHeight: 20 },
  submitButton: { marginTop: 8, width: '100%' },
  switchLink: { marginTop: 16, alignItems: 'center' },
  switchLinkText: { color: Colors.secondary, fontSize: 14 },
  switchLinkBold: { fontWeight: '700', color: Colors.primary },
})
