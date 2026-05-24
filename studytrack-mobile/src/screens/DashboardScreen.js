import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import StatCard from '../components/StatCard'
import Colors from '../constants/colors'
import { MOTIVATION_MESSAGES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

// ── Yardımcılar ───────────────────────────────────────────────────────────────
const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  return []
}
const toDateStr = (d) => d.toISOString().split('T')[0]
const today30 = () => {
  const e = new Date(); e.setDate(e.getDate() + 30)
  return { start: toDateStr(new Date()), end: toDateStr(e) }
}
const todayPlus = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return toDateStr(d) }
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s))

const PLAN_STATUS = { Active: '🟢 Aktif', Completed: '✅ Tamamlandı', Paused: '⏸️ Duraklat.' }

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const { user }  = useAuth()
  const { theme } = useTheme()

  // ── Veriler ──────────────────────────────────────────────────────────────
  const [plans, setPlans]   = useState([])
  const [goals, setGoals]   = useState([])
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [greeting, setGreeting]     = useState('')
  const [motivationMsg, setMotivationMsg] = useState('')
  const [streak] = useState(3)
  const [quickBarH, setQuickBarH] = useState(90) // quick actions bar measured height

  // ── Plan listesi modal ───────────────────────────────────────────────────
  const [showPlansList, setShowPlansList]     = useState(false)
  const [plansListLoading, setPlansListLoading] = useState(false)

  // ── Plan oluşturma modal ─────────────────────────────────────────────────
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [pTitle, setPTitle] = useState('')
  const [pDesc,  setPDesc]  = useState('')
  const [pStart, setPStart] = useState('')
  const [pEnd,   setPEnd]   = useState('')
  const [pSaving, setPSaving] = useState(false)
  const [pErr,    setPErr]    = useState('')
  const [pOK,     setPOK]     = useState(false)

  // ── Hedef listesi modal ──────────────────────────────────────────────────
  const [showGoalsList, setShowGoalsList]       = useState(false)
  const [goalsListLoading, setGoalsListLoading] = useState(false)

  // ── Hedef oluşturma modal ────────────────────────────────────────────────
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [gTitle,       setGTitle]       = useState('')
  const [gHours,       setGHours]       = useState('')
  const [gDeadline,    setGDeadline]    = useState('')
  const [gSaving,      setGSaving]      = useState(false)
  const [gErr,         setGErr]         = useState('')
  const [gOK,          setGOK]          = useState(false)

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar')
    setMotivationMsg(MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)])
    fetchAll()
  }, [])

  // ── Tüm veri çek ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pRes, gRes, tRes] = await Promise.allSettled([
        api.get('/Plans'),
        api.get('/Goals'),
        api.get('/Tasks'),
      ])
      if (pRes.status === 'fulfilled') setPlans(toArray(pRes.value.data))
      if (gRes.status === 'fulfilled') setGoals(toArray(gRes.value.data))
      if (tRes.status === 'fulfilled') {
        const t = toArray(tRes.value.data)
        setTaskStats({ total: t.length, completed: t.filter((x) => x.isCompleted).length })
      }
    } catch (e) {
      console.warn('[DASHBOARD] fetchAll:', e.message)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  // ════════════════════════════════════════════════════════════════════════
  // PLAN MODALLARI
  // ════════════════════════════════════════════════════════════════════════
  const openPlansList = async () => {
    setShowPlansList(true); setPlansListLoading(true)
    try { const r = await api.get('/Plans'); setPlans(toArray(r.data)) }
    catch (e) { console.warn('[DASHBOARD] plansList:', e.message) }
    finally { setPlansListLoading(false) }
  }

  const openCreatePlan = () => {
    const { start, end } = today30()
    setPTitle(''); setPDesc(''); setPStart(start); setPEnd(end)
    setPErr(''); setPOK(false); setShowCreatePlan(true)
  }
  const closeCreatePlan = () => { if (!pSaving) setShowCreatePlan(false) }

  const createPlan = async () => {
    setPErr('')
    if (!pTitle.trim())           { setPErr('Plan başlığı zorunludur.');                           return }
    if (!isValidDate(pStart))     { setPErr('Geçersiz başlangıç tarihi. YYYY-AA-GG kullan.');      return }
    if (!isValidDate(pEnd))       { setPErr('Geçersiz bitiş tarihi. YYYY-AA-GG kullan.');          return }
    if (new Date(pEnd) < new Date(pStart)) { setPErr('Bitiş tarihi başlangıçtan önce olamaz.'); return }

    setPSaving(true)
    try {
      await api.post('/Plans', {
        title: pTitle.trim(), description: pDesc.trim(),
        startDate: new Date(pStart).toISOString(),
        endDate:   new Date(pEnd).toISOString(),
        status: 'Active',
      })
      console.log('[DASHBOARD] ✅ Plan oluşturuldu')
      setPOK(true); await fetchAll()
      setTimeout(() => { setShowCreatePlan(false); setPOK(false) }, 1200)
    } catch (e) {
      setPErr(e.response?.data?.message || e.response?.data?.Message || 'Plan oluşturulamadı.')
    } finally { setPSaving(false) }
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEDEF MODALLARI
  // ════════════════════════════════════════════════════════════════════════
  const openGoalsList = async () => {
    setShowGoalsList(true); setGoalsListLoading(true)
    try { const r = await api.get('/Goals'); setGoals(toArray(r.data)) }
    catch (e) { console.warn('[DASHBOARD] goalsList:', e.message) }
    finally { setGoalsListLoading(false) }
  }

  const openCreateGoal = () => {
    setGTitle(''); setGHours(''); setGDeadline(todayPlus(30))
    setGErr(''); setGOK(false); setShowCreateGoal(true)
  }
  const closeCreateGoal = () => { if (!gSaving) setShowCreateGoal(false) }

  const createGoal = async () => {
    setGErr('')
    if (!gTitle.trim())        { setGErr('Hedef başlığı zorunludur.');                      return }
    if (!isValidDate(gDeadline)) { setGErr('Geçersiz son tarih. YYYY-AA-GG kullan.'); return }
    const hours = parseInt(gHours, 10)
    if (gHours !== '' && (isNaN(hours) || hours < 0)) { setGErr('Saat hedefi geçerli bir sayı olmalı.'); return }

    setGSaving(true)
    try {
      await api.post('/Goals', {
        title:       gTitle.trim(),
        targetHours: isNaN(hours) ? 0 : hours,
        deadline:    new Date(gDeadline).toISOString(),
        isAchieved:  false,
      })
      console.log('[DASHBOARD] ✅ Hedef oluşturuldu')
      setGOK(true); await fetchAll()
      setTimeout(() => { setShowCreateGoal(false); setGOK(false) }, 1200)
    } catch (e) {
      setGErr(e.response?.data?.message || e.response?.data?.Message || 'Hedef oluşturulamadı.')
    } finally { setGSaving(false) }
  }

  // ── Hesaplamalar ──────────────────────────────────────────────────────────
  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100) : 0

  const statCards = [
    { emoji: '📋', label: 'Planlar',    value: plans.length,          bgColor: '#f8bbd0', textColor: '#7a1c4b', onPress: openPlansList },
    { emoji: '🎯', label: 'Hedefler',   value: goals.length,          bgColor: '#d1c4e9', textColor: '#4a148c', onPress: openGoalsList },
    { emoji: '✅', label: 'Tamamlanan', value: taskStats.completed,   bgColor: '#b2dfdb', textColor: '#00695c',
      onPress: () => navigation.navigate('Tasks', { filter: 'completed' }) },
    { emoji: '📝', label: 'Görevler',   value: taskStats.total,       bgColor: '#fff59d', textColor: '#795548',
      onPress: () => navigation.navigate('Tasks', { filter: 'all' }) },
  ]

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: quickBarH + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: theme.primary }]}>
          <Text style={styles.bannerGreeting}>{greeting}! 🌸</Text>
          <Text style={styles.bannerMessage}>{motivationMsg}</Text>
          <View style={styles.bannerBadges}>
            <View style={styles.badge}><Text style={styles.badgeText}>🔥 {streak} gün seri</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>🌟 %{completionRate} tamamlandı</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>🏆 {taskStats.completed} rozet</Text></View>
          </View>
        </View>

        {/* İlerleme */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>🌟 Görev İlerlemen</Text>
            <View style={styles.progressBadge}><Text style={styles.progressBadgeText}>%{completionRate}</Text></View>
          </View>
          <Text style={styles.progressSub}>
            {taskStats.total === 0 ? 'Henüz görev eklemedin 🌸'
              : completionRate === 100 ? 'Tüm görevleri tamamladın 🎉'
              : completionRate >= 70 ? 'Az kaldı, devam et ✨'
              : completionRate >= 40 ? 'İlerlemen güzel 💪'
              : `${taskStats.completed} / ${taskStats.total} görev tamamlandı`}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
        </View>

        {/* İstatistik kartları */}
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>📊 Genel Durum</Text>
        <View style={styles.statsGrid}>
          {statCards.map((c) => <StatCard key={c.label} {...c} />)}
        </View>
      </ScrollView>

      {/* ── Sabit hızlı erişim çubuğu (tab bar üstünde) ─────────────────── */}
      <View style={[styles.quickActionsBar, { borderTopColor: theme.soft100 }]} onLayout={(e) => setQuickBarH(e.nativeEvent.layout.height)}>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.pink50 }]} onPress={openCreatePlan}>
          <Text style={styles.quickBtnEmoji}>➕</Text>
          <Text style={[styles.quickBtnText, { color: Colors.primary }]}>Yeni Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.purple50 }]} onPress={openCreateGoal}>
          <Text style={styles.quickBtnEmoji}>🎯</Text>
          <Text style={[styles.quickBtnText, { color: Colors.secondary }]}>Yeni Hedef</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.yellow50 }]}
          onPress={() => navigation.navigate('Tasks', { openModal: true })}
        >
          <Text style={styles.quickBtnEmoji}>📝</Text>
          <Text style={[styles.quickBtnText, { color: Colors.orange800 }]}>Yeni Görev</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ PLANLARIM LİSTESİ ══════════════════════════════════════════════ */}
      <ListModal
        visible={showPlansList}
        onClose={() => setShowPlansList(false)}
        title="📋 Planlarım"
        loading={plansListLoading}
        empty={plans.length === 0}
        emptyText="Henüz plan yok"
        onNew={() => { setShowPlansList(false); setTimeout(openCreatePlan, 300) }}
      >
        {plans.map((p) => (
          <View key={p.id} style={styles.itemCard}>
            <View style={styles.itemCardTop}>
              <Text style={styles.itemCardTitle} numberOfLines={2}>{p.title || p.Title}</Text>
              <StatusBadge status={p.status} map={PLAN_STATUS} />
            </View>
            {p.description ? <Text style={styles.itemCardSub} numberOfLines={2}>{p.description}</Text> : null}
            {p.startDate && p.endDate
              ? <Text style={styles.itemCardMeta}>📅 {fmt(p.startDate)} → {fmt(p.endDate)}</Text>
              : null}
          </View>
        ))}
      </ListModal>

      {/* ═══ HEDEFLERİM LİSTESİ ════════════════════════════════════════════ */}
      <ListModal
        visible={showGoalsList}
        onClose={() => setShowGoalsList(false)}
        title="🎯 Hedeflerim"
        loading={goalsListLoading}
        empty={goals.length === 0}
        emptyText="Henüz hedef yok"
        onNew={() => { setShowGoalsList(false); setTimeout(openCreateGoal, 300) }}
      >
        {goals.map((g) => (
          <View key={g.id} style={[styles.itemCard, { borderColor: Colors.purple100, backgroundColor: Colors.purple50 }]}>
            <View style={styles.itemCardTop}>
              <Text style={[styles.itemCardTitle, { color: Colors.secondary }]} numberOfLines={2}>{g.title}</Text>
              <View style={[styles.statusBadge, g.isAchieved ? styles.statusDone : styles.statusActive]}>
                <Text style={styles.statusText}>{g.isAchieved ? '✅ Tamamlandı' : '🎯 Devam'}</Text>
              </View>
            </View>
            <Text style={[styles.itemCardMeta, { color: Colors.secondary }]}>
              ⏰ Son tarih: {fmt(g.deadline)}
            </Text>
            {g.targetHours > 0
              ? <Text style={[styles.itemCardMeta, { color: Colors.secondary }]}>🕐 Hedef: {g.targetHours} saat</Text>
              : null}
          </View>
        ))}
      </ListModal>

      {/* ═══ PLAN OLUŞTURMA ════════════════════════════════════════════════ */}
      <CreateModal
        visible={showCreatePlan}
        onClose={closeCreatePlan}
        title="📋 Yeni Plan"
        onSave={createPlan}
        saving={pSaving}
        success={pOK}
        error={pErr}
        accentColor={Colors.primary}
        inputBg={Colors.pink50}
        inputBorder={Colors.pink100}
      >
        <Text style={styles.inputLabel}>Plan Başlığı *</Text>
        <TextInput style={styles.textInput} placeholder="Örn: Haftalık Ders Planı"
          placeholderTextColor="#bbb" value={pTitle}
          onChangeText={(t) => { setPTitle(t); setPErr('') }} maxLength={100} />

        <Text style={styles.inputLabel}>Açıklama (opsiyonel)</Text>
        <TextInput style={[styles.textInput, styles.textArea]} placeholder="Kısa bir açıklama..."
          placeholderTextColor="#bbb" value={pDesc} onChangeText={setPDesc}
          maxLength={200} multiline numberOfLines={2} />

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Başlangıç *</Text>
            <TextInput style={styles.textInput} value={pStart} placeholder="YYYY-AA-GG"
              placeholderTextColor="#bbb" keyboardType="numbers-and-punctuation" maxLength={10}
              onChangeText={(t) => { setPStart(t); setPErr('') }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Bitiş *</Text>
            <TextInput style={styles.textInput} value={pEnd} placeholder="YYYY-AA-GG"
              placeholderTextColor="#bbb" keyboardType="numbers-and-punctuation" maxLength={10}
              onChangeText={(t) => { setPEnd(t); setPErr('') }} />
          </View>
        </View>
      </CreateModal>

      {/* ═══ HEDEF OLUŞTURMA ═══════════════════════════════════════════════ */}
      <CreateModal
        visible={showCreateGoal}
        onClose={closeCreateGoal}
        title="🎯 Yeni Hedef"
        onSave={createGoal}
        saving={gSaving}
        success={gOK}
        error={gErr}
        accentColor={Colors.secondary}
        inputBg={Colors.purple50}
        inputBorder={Colors.purple100}
      >
        <Text style={styles.inputLabel}>Hedef Başlığı *</Text>
        <TextInput style={styles.textInput} placeholder="Örn: Matematik sınavına hazırlan"
          placeholderTextColor="#bbb" value={gTitle}
          onChangeText={(t) => { setGTitle(t); setGErr('') }} maxLength={100} />

        <Text style={styles.inputLabel}>Saat Hedefi (opsiyonel)</Text>
        <TextInput style={styles.textInput} placeholder="Örn: 20"
          placeholderTextColor="#bbb" value={gHours}
          onChangeText={(t) => { setGHours(t); setGErr('') }}
          keyboardType="numeric" maxLength={4} />

        <Text style={styles.inputLabel}>Son Tarih *</Text>
        <TextInput style={styles.textInput} placeholder="YYYY-AA-GG"
          placeholderTextColor="#bbb" value={gDeadline}
          onChangeText={(t) => { setGDeadline(t); setGErr('') }}
          keyboardType="numbers-and-punctuation" maxLength={10} />
      </CreateModal>
    </SafeAreaView>
  )
}

// ── Küçük yardımcı bileşenler ─────────────────────────────────────────────────
const fmt = (iso) => {
  try { return new Date(iso).toLocaleDateString('tr-TR') } catch { return iso }
}

function StatusBadge({ status, map }) {
  const label = map?.[status] || status
  const s = status === 'Active' ? styles.statusActive
          : status === 'Completed' ? styles.statusDone : styles.statusPaused
  return <View style={[styles.statusBadge, s]}><Text style={styles.statusText}>{label}</Text></View>
}

/** Yeniden kullanılabilir liste modalı */
function ListModal({ visible, onClose, title, loading, empty, emptyText, onNew, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: '80%' }]} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity style={styles.newBtn} onPress={onNew}>
              <Text style={styles.newBtnText}>+ Yeni</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.centeredPad}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingTxt}>Yükleniyor...</Text>
            </View>
          ) : empty ? (
            <View style={styles.centeredPad}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyTxt}>{emptyText}</Text>
              <TouchableOpacity style={styles.emptyCreateBtn} onPress={onNew}>
                <Text style={styles.emptyCreateBtnText}>Hemen oluştur ✨</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
              {children}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/** Yeniden kullanılabilir oluşturma modalı */
function CreateModal({ visible, onClose, title, onSave, saving, success, error, accentColor, inputBg, inputBorder, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: accentColor }]}>{title}</Text>
            {success ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✅ Oluşturuldu!</Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.formErrBanner}>
                    <Text style={styles.formErrText}>⚠️ {error}</Text>
                  </View>
                ) : null}
                {children}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                    <Text style={styles.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: accentColor }, saving && { opacity: 0.6 }]}
                    onPress={onSave} disabled={saving}
                  >
                    {saving
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.saveBtnText}>Oluştur ✨</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ── Stiller ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  container: { padding: 16 },

  quickActionsBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.pink100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },

  banner: { borderRadius: 24, padding: 24, marginBottom: 16, backgroundColor: Colors.primary },
  bannerGreeting: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8 },
  bannerMessage:  { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 16 },
  bannerBadges:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle:  { fontSize: 18, fontWeight: '700', color: Colors.teal700 },
  progressBadge:  { backgroundColor: Colors.teal50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  progressBadgeText: { color: Colors.teal700, fontWeight: '700', fontSize: 13 },
  progressSub:  { color: '#26a69a', fontSize: 14, marginBottom: 12 },
  progressBar:  { width: '100%', height: 14, backgroundColor: '#d7f3ef', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#26a69a', borderRadius: 999 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },

  quickBtn:      { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 18 },
  quickBtnEmoji: { fontSize: 24, marginBottom: 6 },
  quickBtnText:  { fontSize: 12, fontWeight: '700' },

  // ── Modal ortak ──
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 22, fontWeight: '700', color: Colors.primary },

  newBtn:     { backgroundColor: Colors.pink50, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.borderPink },
  newBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

  centeredPad: { alignItems: 'center', paddingVertical: 40 },
  loadingTxt:  { marginTop: 12, color: Colors.textLight, fontSize: 14 },
  emptyEmoji:  { fontSize: 44, marginBottom: 10 },
  emptyTxt:    { color: Colors.textLight, fontSize: 15, fontWeight: '600', marginBottom: 16 },
  emptyCreateBtn:     { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  emptyCreateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Liste kartları ──
  itemCard: {
    backgroundColor: Colors.pink50, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1.5, borderColor: Colors.pink100,
  },
  itemCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  itemCardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  itemCardSub:   { fontSize: 13, color: Colors.textLight, marginBottom: 4 },
  itemCardMeta:  { fontSize: 12, color: Colors.primary },

  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusActive: { backgroundColor: '#e8f5e9' },
  statusDone:   { backgroundColor: '#e3f2fd' },
  statusPaused: { backgroundColor: '#fff8e1' },
  statusText:   { fontSize: 11, fontWeight: '700' },

  // ── Form ──
  successBanner: { backgroundColor: '#e8f5e9', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#c3e6cb' },
  successText:   { color: '#2e7d32', fontWeight: '700', fontSize: 16 },
  formErrBanner: { backgroundColor: '#fff3cd', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#ffc107' },
  formErrText:   { color: '#856404', fontSize: 13 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: Colors.pink100, borderRadius: 12,
    padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.pink50, marginBottom: 14,
  },
  textArea: { height: 64, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Colors.pink50, borderWidth: 1.5, borderColor: Colors.borderPink },
  cancelBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  saveBtn:    { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
