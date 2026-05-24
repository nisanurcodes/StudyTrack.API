/**
 * ProfileScreen
 *
 * Gerçek API:   GET /api/Plans, /api/Goals, /api/Tasks
 *               PUT /api/Auth/profile → profil güncelleme
 * Yerel depo:   AsyncStorage (@studytrack_notifications, @studytrack_theme)
 * Frontend:     Streak ve rozet hesabı (backend endpoint yok)
 *
 * TODO (ileride):
 *   GET /api/Streak  → gerçek streak (şu an dueDate proxy ile hesaplanıyor)
 *   GET /api/Badges  → rozetler
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
  Modal, TextInput, Switch, KeyboardAvoidingView,
  Platform, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Colors from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

// ── AsyncStorage anahtarı (sadece bildirimler — tema ThemeContext'te) ─────────
const NOTIF_KEY = '@studytrack_notifications'

// ── Yardımcılar ───────────────────────────────────────────────────────────────
const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  return []
}

// ── Streak hesabı ─────────────────────────────────────────────────────────────
// completedAt alanı backend'de olmadığından dueDate proxy olarak kullanılıyor.
// Gerçek streak için StudyTask.CompletedAt eklenmeli.
function calcStreak(tasks) {
  const completed = tasks.filter((t) => t.isCompleted)
  if (completed.length === 0) return 0

  const dateSet = new Set(
    completed
      .map((t) => { try { return new Date(t.dueDate).toISOString().split('T')[0] } catch { return null } })
      .filter(Boolean)
  )
  if (dateSet.size === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const cursor = new Date(today)
  if (!dateSet.has(todayStr)) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    if (dateSet.has(d.toISOString().split('T')[0])) streak++
    else break
  }
  return streak
}

// ── Rozet tanımları ───────────────────────────────────────────────────────────
const BADGE_DEFS = [
  { emoji: '🏆', label: 'İlk Adım',      desc: '1 görev tamamla',            check: (s) => s.completedTasks >= 1 },
  { emoji: '⭐', label: 'Çalışkan',       desc: '5 görev tamamla',            check: (s) => s.completedTasks >= 5 },
  { emoji: '💪', label: 'Azimli',         desc: '10 görev tamamla',           check: (s) => s.completedTasks >= 10 },
  { emoji: '📋', label: 'Planlayıcı',    desc: '3 plan oluştur',             check: (s) => s.totalPlans >= 3 },
  { emoji: '🎯', label: 'Hedef Avcısı',  desc: '3 hedef oluştur',            check: (s) => s.totalGoals >= 3 },
  { emoji: '🔥', label: '3 Gün Serisi',  desc: '3 gün üst üste çalış',       check: (s) => s.streak >= 3 },
  { emoji: '🌟', label: 'Süper Kullanıcı', desc: '5 plan + 5 hedef + 10 görev', check: (s) => s.totalPlans >= 5 && s.totalGoals >= 5 && s.completedTasks >= 10 },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout, updateUser }          = useAuth()
  const { theme, themeKey, setTheme, THEMES_LIST } = useTheme()

  // ── API verisi ────────────────────────────────────────────────────────────
  const [plans,      setPlans]      = useState([])
  const [goals,      setGoals]      = useState([])
  const [tasks,      setTasks]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState('')

  // ── Modal görünürlüğü ─────────────────────────────────────────────────────
  const [showEditProfile,   setShowEditProfile]   = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showTheme,         setShowTheme]         = useState(false)
  const [showAbout,         setShowAbout]         = useState(false)

  // ── Profil düzenleme formu ────────────────────────────────────────────────
  const [editName,     setEditName]     = useState('')
  const [editEmail,    setEditEmail]    = useState('')
  const [profileErr,   setProfileErr]   = useState('')
  const [profileOK,    setProfileOK]    = useState(false)
  const [profileSaving,setProfileSaving]= useState(false)

  // ── Bildirim tercihleri ───────────────────────────────────────────────────
  const [notifDaily,   setNotifDaily]   = useState(false)
  const [notifDueDate, setNotifDueDate] = useState(true)
  const [notifGoal,    setNotifGoal]    = useState(true)

  // ── Tercihler yükleme — sadece bildirimler (tema ThemeContext'te) ─────────
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [[, notifStr]] = await AsyncStorage.multiGet([NOTIF_KEY])
        if (notifStr) {
          const n = JSON.parse(notifStr)
          if (n.daily   != null) setNotifDaily(n.daily)
          if (n.dueDate != null) setNotifDueDate(n.dueDate)
          if (n.goal    != null) setNotifGoal(n.goal)
        }
      } catch {}
    }
    loadPrefs()
  }, [])

  // ── API veri çekme ────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setFetchError('')
    try {
      const [pRes, gRes, tRes] = await Promise.allSettled([
        api.get('/Plans'),
        api.get('/Goals'),
        api.get('/Tasks'),
      ])
      if (pRes.status === 'fulfilled') setPlans(toArray(pRes.value.data))
      if (gRes.status === 'fulfilled') setGoals(toArray(gRes.value.data))
      if (tRes.status === 'fulfilled') setTasks(toArray(tRes.value.data))
      if (pRes.status === 'rejected' && gRes.status === 'rejected' && tRes.status === 'rejected')
        setFetchError('Veriler yüklenemedi. Aşağı çekerek yenile.')
    } catch (e) {
      setFetchError('Bağlantı hatası.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { setLoading(true); fetchStats() }, [fetchStats]))
  const onRefresh = () => { setRefreshing(true); fetchStats() }

  // ── Hesaplamalar ──────────────────────────────────────────────────────────
  const completedTasks = tasks.filter((t) => t.isCompleted).length
  const streak         = calcStreak(tasks)
  const stats          = { completedTasks, totalTasks: tasks.length, totalPlans: plans.length, totalGoals: goals.length, streak }
  const badges         = BADGE_DEFS.map((b) => ({ ...b, unlocked: b.check(stats) }))
  const unlockedCount  = badges.filter((b) => b.unlocked).length

  const userStats = [
    { emoji: '📋', label: 'Toplam Plan',  value: plans.length },
    { emoji: '🎯', label: 'Toplam Hedef', value: goals.length },
    { emoji: '📝', label: 'Toplam Görev', value: tasks.length },
    { emoji: '✅', label: 'Tamamlanan',   value: completedTasks },
    { emoji: '🔥', label: 'Günlük Seri',  value: streak },
    { emoji: '🏆', label: 'Rozet',        value: `${unlockedCount}/${badges.length}` },
  ]

  // ── Profil kaydet ─────────────────────────────────────────────────────────
  const openEditProfile = () => {
    setEditName(user?.name || user?.displayName || '')
    setEditEmail(user?.email || '')
    setProfileErr(''); setProfileOK(false)
    setShowEditProfile(true)
  }

  const saveProfile = async () => {
    setProfileErr('')
    const name  = editName.trim()
    const email = editEmail.trim()
    if (name.length < 2)              { setProfileErr('Ad Soyad en az 2 karakter olmalı.');  return }
    if (!/\S+@\S+\.\S+/.test(email)) { setProfileErr('Geçerli bir e-posta adresi gir.');    return }

    setProfileSaving(true)
    try {
      const res = await api.put('/Auth/profile', { name, email })
      // Backend { user: { id, name, email } } döndürür
      const updated = res.data?.user ?? res.data
      await updateUser({
        name:        updated.name  ?? name,
        displayName: updated.name  ?? name,
        email:       updated.email ?? email,
      })
      setProfileOK(true)
      setTimeout(() => { setShowEditProfile(false); setProfileOK(false) }, 1200)
    } catch (err) {
      const msg = err?.response?.data?.message
      setProfileErr(msg || 'Profil güncellenemedi. Tekrar dene.')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Bildirim toggle ───────────────────────────────────────────────────────
  const toggleNotif = async (field, value) => {
    const current = { daily: notifDaily, dueDate: notifDueDate, goal: notifGoal }
    const updated = { ...current, [field]: value }
    const setters = { daily: setNotifDaily, dueDate: setNotifDueDate, goal: setNotifGoal }
    setters[field](value)
    try { await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated)) } catch {}
  }

  // ── Tema seç — ThemeContext üzerinden ────────────────────────────────────
  const selectTheme = (key) => setTheme(key)

  // ── Çıkış ─────────────────────────────────────────────────────────────────
  const handleLogout = () =>
    Alert.alert('Çıkış Yap', 'Oturumunu kapatmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ])

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Profil kartı */}
        <View style={[styles.profileCard, { borderColor: theme.accent100 }]}>
          <View style={[styles.avatarCircle, { borderColor: theme.primary }]}>
            <Text style={styles.avatarEmoji}>🌸</Text>
          </View>
          <Text style={styles.username}>
            {user?.displayName || user?.name || user?.email?.split('@')[0] || 'Öğrenci'}
          </Text>
          <Text style={styles.email}>{user?.email || 'kullanici@mail.com'}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              🔥 {streak > 0 ? `${streak} günlük seri` : 'Seri başlatılmadı'}
            </Text>
          </View>
        </View>

        {/* Motivasyon */}
        <View style={[styles.motivationCard, { borderLeftColor: theme.primary }]}>
          <Text style={styles.motivationText}>✨ "Az ama düzenli ilerleme çok güçlüdür"</Text>
        </View>

        {/* Hata */}
        {fetchError ? (
          <View style={styles.errorBanner}><Text style={styles.errorText}>⚠️ {fetchError}</Text></View>
        ) : null}

        {/* İstatistikler */}
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>📊 İstatistiklerim</Text>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {userStats.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: theme.secondary }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rozetler */}
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>🏆 Rozetlerim</Text>
        <Text style={styles.badgeSubtitle}>
          {unlockedCount === 0
            ? 'Rozet kazanmak için görev tamamlamaya başla! 🌱'
            : unlockedCount === badges.length
            ? 'Tüm rozetleri kazandın! 🎊'
            : `${unlockedCount} rozet kazandın, ${badges.length - unlockedCount} tane kaldı ✨`}
        </Text>
        {!loading && (
          <View style={styles.badgesGrid}>
            {badges.map((b) => (
              <View key={b.label} style={styles.badgeItem}>
                <View style={[styles.badgeCircle, b.unlocked ? styles.badgeCircleOn : styles.badgeCircleOff]}>
                  <Text style={[styles.badgeEmoji, !b.unlocked && { opacity: 0.4 }]}>
                    {b.unlocked ? b.emoji : '🔒'}
                  </Text>
                </View>
                <Text style={[styles.badgeLabel, !b.unlocked && styles.badgeLabelOff]}>{b.label}</Text>
                <Text style={styles.badgeDesc} numberOfLines={1}>{b.unlocked ? '✅' : b.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Hesabım menüsü */}
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>⚙️ Hesabım</Text>
        <View style={styles.menuCard}>
          <MenuItem emoji="👤" label="Profili Düzenle"  onPress={openEditProfile} />
          <View style={styles.menuDivider} />
          <MenuItem emoji="🔔" label="Bildirimler"      onPress={() => setShowNotifications(true)} />
          <View style={styles.menuDivider} />
          <MenuItem emoji="🎨" label={`Tema — ${theme.emoji} ${theme.label}`} onPress={() => setShowTheme(true)} />
          <View style={styles.menuDivider} />
          <MenuItem emoji="ℹ️" label="Hakkında"         onPress={() => setShowAbout(true)} />
        </View>

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap 👋</Text>
        </TouchableOpacity>

        <Text style={styles.version}>StudyTrack Mobil v1.0.0</Text>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALler
      ══════════════════════════════════════════════════════════════════════ */}

      {/* 1 ── Profili Düzenle ─────────────────────────────────────────────── */}
      <Modal visible={showEditProfile} transparent animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}>
        <Pressable style={styles.backdrop} onPress={() => !profileSaving && setShowEditProfile(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>👤 Profili Düzenle</Text>

              {profileOK ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✅ Profil güncellendi!</Text>
                </View>
              ) : (
                <>
                  {profileErr ? (
                    <View style={styles.errBanner}><Text style={styles.errText}>⚠️ {profileErr}</Text></View>
                  ) : null}

                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Adın ve soyadın"
                    placeholderTextColor="#bbb"
                    value={editName}
                    onChangeText={(t) => { setEditName(t); setProfileErr('') }}
                    autoCapitalize="words"
                    maxLength={60}
                  />

                  <Text style={styles.inputLabel}>E-posta</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ornek@mail.com"
                    placeholderTextColor="#bbb"
                    value={editEmail}
                    onChangeText={(t) => { setEditEmail(t); setProfileErr('') }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={120}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelBtn}
                      onPress={() => setShowEditProfile(false)} disabled={profileSaving}>
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: theme.secondary }, profileSaving && { opacity: 0.6 }]}
                      onPress={saveProfile} disabled={profileSaving}>
                      {profileSaving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveBtnText}>Kaydet ✨</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2 ── Bildirimler ────────────────────────────────────────────────── */}
      <Modal visible={showNotifications} transparent animationType="slide"
        onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>🔔 Bildirimler</Text>
            <Text style={styles.sheetSubtitle}>Tercihlerin otomatik kaydedilir.</Text>

            <NotifRow
              emoji="☀️"
              label="Günlük Hatırlatma"
              subtitle="Her gün çalışma vaktin geldi!"
              value={notifDaily}
              onChange={(v) => toggleNotif('daily', v)}
              thumbColor={theme.primary}
            />
            <View style={styles.notifDivider} />
            <NotifRow
              emoji="⏰"
              label="Görev Son Tarihi"
              subtitle="Yaklaşan görev bitiş tarihleri"
              value={notifDueDate}
              onChange={(v) => toggleNotif('dueDate', v)}
              thumbColor={theme.primary}
            />
            <View style={styles.notifDivider} />
            <NotifRow
              emoji="🎯"
              label="Hedef Bitiş Tarihi"
              subtitle="Yaklaşan hedef son tarihleri"
              value={notifGoal}
              onChange={(v) => toggleNotif('goal', v)}
              thumbColor={theme.primary}
            />

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                ℹ️ Bildirimler AsyncStorage'da saklanır. Gerçek push bildirimi için Expo Notifications entegrasyonu gereklidir.
              </Text>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
              onPress={() => setShowNotifications(false)}>
              <Text style={styles.saveBtnText}>Tamam</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3 ── Tema ───────────────────────────────────────────────────────── */}
      <Modal visible={showTheme} transparent animationType="slide"
        onRequestClose={() => setShowTheme(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowTheme(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>🎨 Tema Seç</Text>
            <Text style={styles.sheetSubtitle}>Seçim kaydedilir.</Text>

            <View style={styles.themesGrid}>
              {THEMES_LIST.map((t) => (
                <TouchableOpacity key={t.key} style={styles.themeItem} onPress={() => selectTheme(t.key)}>
                  <View style={[
                    styles.themeSwatch,
                    { backgroundColor: t.primary },
                    themeKey === t.key && styles.themeSwatchSelected,
                  ]}>
                    <Text style={styles.themeSwatchCheck}>
                      {themeKey === t.key ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.themeLabel, themeKey === t.key && { color: t.primary, fontWeight: '700' }]}>
                    {t.emoji} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                ℹ️ Tüm uygulamaya uygulamak için ThemeContext entegrasyonu gereklidir. Seçim şimdilik kaydedilir.
              </Text>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.secondary, marginTop: 8 }]}
              onPress={() => setShowTheme(false)}>
              <Text style={styles.saveBtnText}>Tamam</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4 ── Hakkında ───────────────────────────────────────────────────── */}
      <Modal visible={showAbout} transparent animationType="slide"
        onRequestClose={() => setShowAbout(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowAbout(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.aboutLogoRow}>
              <Text style={styles.aboutEmoji}>🌸</Text>
              <Text style={styles.aboutAppName}>StudyTrack</Text>
            </View>

            <View style={styles.aboutCard}>
              <AboutRow emoji="📱" label="Uygulama"  value="StudyTrack Mobil v1.0.0" />
              <AboutRow emoji="🎓" label="Proje"     value="Yazılım Mühendisliği Projesi" />
              <AboutRow emoji="⚛️"  label="Mobil"    value="React Native + Expo SDK 54" />
              <AboutRow emoji="🌐" label="Backend"   value="ASP.NET Core 8 + REST API" />
              <AboutRow emoji="🗃️" label="Veritabanı" value="Entity Framework Core" />
              <AboutRow emoji="🔐" label="Kimlik"    value="JWT Bearer Token" />
              <AboutRow emoji="☁️"  label="Sunucu"   value="Render.com (studytrack-api)" />
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
              onPress={() => setShowAbout(false)}>
              <Text style={styles.saveBtnText}>Kapat</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

// ── Küçük yardımcı bileşenler ─────────────────────────────────────────────────
function MenuItem({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  )
}

function NotifRow({ emoji, label, subtitle, value, onChange, thumbColor }) {
  return (
    <View style={styles.notifRow}>
      <Text style={styles.notifEmoji}>{emoji}</Text>
      <View style={styles.notifTextCol}>
        <Text style={styles.notifLabel}>{label}</Text>
        <Text style={styles.notifSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#e0e0e0', true: Colors.pink100 }}
        thumbColor={value ? (thumbColor || Colors.primary) : '#f4f3f4'}
      />
    </View>
  )
}

function AboutRow({ emoji, label, value }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={styles.aboutRowEmoji}>{emoji}</Text>
      <Text style={styles.aboutRowLabel}>{label}</Text>
      <Text style={styles.aboutRowValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

// ── Stiller ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.purple50 },
  scroll:    { flex: 1 },
  container: { padding: 16, paddingBottom: 96 },

  // ── Profil kartı ──
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: 28, padding: 28,
    alignItems: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    borderWidth: 2, borderColor: Colors.purple100,
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.pink100, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 3, borderColor: Colors.primary,
  },
  avatarEmoji: { fontSize: 44 },
  username:    { fontSize: 24, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  email:       { fontSize: 14, color: Colors.textLight, marginBottom: 12 },
  streakBadge: {
    backgroundColor: Colors.orange50, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1.5, borderColor: Colors.yellow200,
  },
  streakText: { fontSize: 13, fontWeight: '700', color: Colors.orange800 },

  // ── Motivasyon ──
  motivationCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  motivationText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 20 },

  errorBanner: {
    backgroundColor: '#fff3cd', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#ffc107',
  },
  errorText: { color: '#856404', fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.secondary, marginBottom: 12 },
  loadingBox:   { alignItems: 'center', paddingVertical: 32, marginBottom: 20 },
  loadingText:  { marginTop: 10, color: Colors.textLight, fontSize: 13 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
  statItem: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    alignItems: 'center', width: '30%', flexGrow: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.secondary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textLight, textAlign: 'center' },

  // ── Rozetler ──
  badgeSubtitle: { fontSize: 13, color: Colors.textLight, marginBottom: 14, marginTop: -4 },
  badgesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  badgeItem:     { alignItems: 'center', width: '13%', flexGrow: 1, minWidth: 72 },
  badgeCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, borderWidth: 2,
  },
  badgeCircleOn:  { backgroundColor: Colors.yellow50, borderColor: Colors.yellow200 },
  badgeCircleOff: { backgroundColor: '#f0f0f0',       borderColor: '#d0d0d0' },
  badgeEmoji:     { fontSize: 26 },
  badgeLabel:     { fontSize: 11, color: Colors.textLight, textAlign: 'center', fontWeight: '600' },
  badgeLabelOff:  { color: '#c0c0c0' },
  badgeDesc:      { fontSize: 9, color: '#b0b0b0', textAlign: 'center', marginTop: 2, lineHeight: 12 },

  // ── Menü ──
  menuCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  menuItem:    { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuEmoji:   { fontSize: 20, marginRight: 12 },
  menuLabel:   { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  menuArrow:   { fontSize: 20, color: Colors.textLight },
  menuDivider: { height: 1, backgroundColor: Colors.pink50, marginHorizontal: 16 },

  // ── Çıkış ──
  logoutButton: {
    backgroundColor: Colors.pink50, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.borderPink, marginBottom: 20,
  },
  logoutText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  version:    { textAlign: 'center', color: Colors.textLight, fontSize: 12 },

  // ── Modal ortak ──
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle:       { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:   { fontSize: 22, fontWeight: '700', color: Colors.secondary, marginBottom: 4 },
  sheetSubtitle:{ fontSize: 13, color: Colors.textLight, marginBottom: 20 },

  noteBox: {
    backgroundColor: Colors.purple50, borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.purple100,
  },
  noteText: { color: Colors.secondary, fontSize: 12, lineHeight: 18 },

  successBanner: {
    backgroundColor: '#e8f5e9', borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: '#c3e6cb',
  },
  successText: { color: '#2e7d32', fontWeight: '700', fontSize: 16 },

  errBanner: {
    backgroundColor: '#fff3cd', borderRadius: 10, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: '#ffc107',
  },
  errText: { color: '#856404', fontSize: 13 },

  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.secondary, marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: Colors.purple100, borderRadius: 12,
    padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.purple50, marginBottom: 16,
  },

  modalButtons:  { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.pink50, borderWidth: 1.5, borderColor: Colors.borderPink,
  },
  cancelBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  saveBtn:       { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Bildirimler ──
  notifRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  notifEmoji:   { fontSize: 24, marginRight: 12 },
  notifTextCol: { flex: 1 },
  notifLabel:   { fontSize: 15, fontWeight: '600', color: Colors.text },
  notifSub:     { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  notifDivider: { height: 1, backgroundColor: Colors.pink50, marginVertical: 2 },

  // ── Tema ──
  themesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  themeItem:  { flex: 1, alignItems: 'center' },
  themeSwatch: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  themeSwatchSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
  themeSwatchCheck:    { color: '#fff', fontSize: 22, fontWeight: '700' },
  themeLabel:          { fontSize: 12, color: Colors.textLight, textAlign: 'center' },

  // ── Hakkında ──
  aboutLogoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  aboutEmoji:   { fontSize: 40 },
  aboutAppName: { fontSize: 30, fontWeight: '700', color: Colors.secondary },
  aboutCard:    { backgroundColor: Colors.purple50, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.purple100 },
  aboutRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.purple100 },
  aboutRowEmoji:{ fontSize: 18, marginRight: 10, width: 28, textAlign: 'center' },
  aboutRowLabel:{ fontSize: 13, color: Colors.textLight, width: 90 },
  aboutRowValue:{ flex: 1, fontSize: 13, fontWeight: '600', color: Colors.secondary },
})
