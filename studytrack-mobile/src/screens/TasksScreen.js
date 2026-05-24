/**
 * TasksScreen — Study.API endpointleri:
 *
 * GET    /api/Tasks          → [ { id, planId, title, isCompleted, dueDate } ]
 * POST   /api/Tasks          → { planId: int, title, isCompleted, dueDate }
 * PUT    /api/Tasks/{id}     → { planId, title, isCompleted, dueDate }
 * DELETE /api/Tasks/{id}
 * GET    /api/Plans          → [ { id, title, ... } ]
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Colors from '../constants/colors'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  return []
}

// Basit tarih doğrulama (YYYY-MM-DD)
const isValidDate = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const d = new Date(str)
  return d instanceof Date && !isNaN(d)
}

export default function TasksScreen({ navigation, route }) {
  const { theme } = useTheme()
  const [tasks, setTasks]           = useState([])
  const [plans, setPlans]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]         = useState('all')
  const [toggling, setToggling]     = useState(null)

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showModal, setShowModal]   = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  // ── Planları sessizce yenile (modal için) ────────────────────────────────
  const refreshPlans = useCallback(async () => {
    try {
      const res = await api.get('/Plans')
      const loaded = toArray(res.data)
      setPlans(loaded)
      if (loaded.length > 0) setSelectedPlanId(loaded[0].id)
      console.log('[TASKS] Plans yenilendi:', loaded.length)
    } catch (err) {
      console.warn('[TASKS] Plans yenilenirken hata:', err.message)
    }
  }, [])

  // ── Route param: Dashboard'dan "Yeni Görev" ile gelindi ──────────────────
  useEffect(() => {
    if (route?.params?.openModal) {
      refreshPlans().then(() => setShowModal(true))
      navigation.setParams({ openModal: false })
    }
  }, [route?.params?.openModal])

  // ── Route param: Dashboard'dan filtre ile gelindi ─────────────────────────
  useEffect(() => {
    const f = route?.params?.filter
    if (f && ['all', 'pending', 'completed'].includes(f)) {
      setFilter(f)
      navigation.setParams({ filter: undefined })
    }
  }, [route?.params?.filter])

  // ── Veri yükle ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setError('')
    try {
      const [tasksRes, plansRes] = await Promise.allSettled([
        api.get('/Tasks'),
        api.get('/Plans'),
      ])

      if (tasksRes.status === 'fulfilled') {
        setTasks(toArray(tasksRes.value.data))
        console.log('[TASKS] Görev sayısı:', toArray(tasksRes.value.data).length)
      } else {
        console.warn('[TASKS] Görevler yüklenemedi:', tasksRes.reason?.message)
        setError('Görevler yüklenemedi. Aşağı çekerek yenile.')
      }

      if (plansRes.status === 'fulfilled') {
        const loadedPlans = toArray(plansRes.value.data)
        setPlans(loadedPlans)
        // İlk planı varsayılan seç
        if (loadedPlans.length > 0 && selectedPlanId === null) {
          setSelectedPlanId(loadedPlans[0].id)
        }
      } else {
        console.warn('[TASKS] Planlar yüklenemedi:', plansRes.reason?.message)
      }
    } catch (err) {
      console.warn('[TASKS] fetchData hatası:', err.message)
      setError('Bağlantı hatası. İnternet bağlantını kontrol et.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Sekmeye her gelindiğinde (dahil ilk açılış) verileri yenile
  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // ── Plan başlığı bul ──────────────────────────────────────────────────────
  const planTitle = (planId) => {
    const found = plans.find((p) => p.id === planId)
    return found?.title || found?.Title || `Plan #${planId}`
  }

  // ── Modal aç/kapat ────────────────────────────────────────────────────────
  const openModal = () => {
    setNewTitle('')
    setNewDueDate('')
    setFormError('')
    // Her açılışta planları tazele — yeni plan eklenmiş olabilir
    refreshPlans()
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setFormError('')
  }

  // ── Görev oluştur ─────────────────────────────────────────────────────────
  const createTask = async () => {
    setFormError('')

    if (!newTitle.trim()) {
      setFormError('Görev başlığı zorunludur.')
      return
    }
    if (!newDueDate.trim()) {
      setFormError('Son tarih zorunludur. (Örn: 2026-06-15)')
      return
    }
    if (!isValidDate(newDueDate.trim())) {
      setFormError('Geçersiz tarih. YYYY-AA-GG formatı kullan. (Örn: 2026-06-15)')
      return
    }
    if (selectedPlanId === null) {
      setFormError(plans.length === 0
        ? 'Görev eklemek için önce bir plan oluşturman gerekiyor.'
        : 'Lütfen bir plan seç.')
      return
    }

    setSaving(true)
    try {
      const body = {
        planId:      selectedPlanId,
        title:       newTitle.trim(),
        isCompleted: false,
        dueDate:     new Date(newDueDate.trim()).toISOString(),
      }
      console.log('[TASKS] Görev oluşturuluyor:', body)
      await api.post('/Tasks', body)
      console.log('[TASKS] ✅ Görev oluşturuldu')
      closeModal()
      fetchData()   // listeyi yenile
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.Message ||
        'Görev oluşturulamadı. Tekrar dene.'
      console.warn('[TASKS] Oluşturma hatası:', err.response?.data || err.message)
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle tamamlandı ─────────────────────────────────────────────────────
  const toggleTask = async (task) => {
    if (toggling === task.id) return
    setToggling(task.id)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
    )
    try {
      await api.put(`/Tasks/${task.id}`, {
        planId:      task.planId,
        title:       task.title,
        isCompleted: !task.isCompleted,
        dueDate:     task.dueDate,
      })
    } catch (err) {
      console.warn('[TASKS] Toggle hatası:', err.response?.data || err.message)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t))
      )
      Alert.alert('Hata', 'Görev durumu güncellenemedi.')
    } finally {
      setToggling(null)
    }
  }

  // ── Görev sil ─────────────────────────────────────────────────────────────
  const deleteTask = (task) => {
    Alert.alert('Görevi Sil', `"${task.title}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id))
          try {
            await api.delete(`/Tasks/${task.id}`)
          } catch (err) {
            console.warn('[TASKS] Silme hatası:', err.response?.data || err.message)
            setTasks((prev) => [...prev, task])
            Alert.alert('Hata', 'Görev silinemedi.')
          }
        },
      },
    ])
  }

  // ── Filtre ────────────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending')   return !t.isCompleted
    if (filter === 'completed') return t.isCompleted
    return true
  })
  const completedCount = tasks.filter((t) => t.isCompleted).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primary }]}>📝 Görevlerim</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.soft100 }]} onPress={openModal}>
            <Text style={[styles.addButtonText, { color: theme.primaryDark }]}>+ Yeni</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Görevler yükleniyor...</Text>
          </View>
        ) : (
          <>
            {/* Özet */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryChip, { backgroundColor: Colors.yellow50 }]}>
                <Text style={[styles.summaryChipText, { color: Colors.orange800 }]}>
                  📝 Toplam: {tasks.length}
                </Text>
              </View>
              <View style={[styles.summaryChip, { backgroundColor: Colors.teal50 }]}>
                <Text style={[styles.summaryChipText, { color: Colors.teal700 }]}>
                  ✅ Tamamlanan: {completedCount}
                </Text>
              </View>
              <View style={[styles.summaryChip, { backgroundColor: Colors.pink50 }]}>
                <Text style={[styles.summaryChipText, { color: Colors.primary }]}>
                  ⭕ Bekleyen: {tasks.length - completedCount}
                </Text>
              </View>
            </View>

            {/* Filtre butonları */}
            <View style={styles.filterRow}>
              {['all', 'pending', 'completed'].map((f) => {
                const labels = { all: 'Tümü', pending: 'Bekleyenler', completed: 'Tamamlananlar' }
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  >
                    <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                      {labels[f]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Görev listesi */}
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌸</Text>
                <Text style={styles.emptyText}>
                  {tasks.length === 0
                    ? 'Henüz görev yok'
                    : filter === 'completed'
                    ? 'Tamamlanan görev yok'
                    : filter === 'pending'
                    ? 'Bekleyen görev yok'
                    : 'Görev bulunamadı'}
                </Text>
                {tasks.length === 0 && (
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={openModal}>
                    <Text style={styles.emptyAddBtnText}>+ İlk görevi ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredTasks.map((task) => (
                <View
                  key={task.id}
                  style={[styles.taskCard, task.isCompleted && styles.taskCardCompleted]}
                >
                  <TouchableOpacity
                    onPress={() => toggleTask(task)}
                    style={styles.checkButton}
                    disabled={toggling === task.id}
                  >
                    {toggling === task.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.checkIcon}>{task.isCompleted ? '✅' : '⭕'}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.isCompleted && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>📚 {planTitle(task.planId)}</Text>
                    {task.dueDate ? (
                      <Text style={styles.taskMeta}>
                        ⏰ {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity onPress={() => deleteTask(task)} style={styles.deleteButton}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── Görev Oluşturma Modalı ─────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Tutamaç */}
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>📝 Yeni Görev</Text>

              {/* Form hatası */}
              {formError ? (
                <View style={styles.formErrorBanner}>
                  <Text style={styles.formErrorText}>⚠️ {formError}</Text>
                </View>
              ) : null}

              {/* Başlık */}
              <Text style={styles.inputLabel}>Görev Başlığı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Görev açıklaması"
                placeholderTextColor="#bbb"
                value={newTitle}
                onChangeText={(t) => { setNewTitle(t); setFormError('') }}
                maxLength={120}
                returnKeyType="next"
              />

              {/* Son tarih */}
              <Text style={styles.inputLabel}>Son Tarih * (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 2026-06-15"
                placeholderTextColor="#bbb"
                value={newDueDate}
                onChangeText={(t) => { setNewDueDate(t); setFormError('') }}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                returnKeyType="done"
              />

              {/* Plan seçimi */}
              <Text style={styles.inputLabel}>Plan *</Text>
              {plans.length === 0 ? (
                <View style={styles.noPlansBanner}>
                  <Text style={styles.noPlansText}>
                    Henüz plan yok. Web uygulamasında plan oluşturduktan sonra buradan seçebilirsin.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.planScrollRow}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {plans.map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => setSelectedPlanId(plan.id)}
                      style={[
                        styles.planChip,
                        selectedPlanId === plan.id && styles.planChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.planChipText,
                          selectedPlanId === plan.id && styles.planChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {plan.title || plan.Title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Butonlar */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={createTask}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Ekle ✨</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.yellow50 },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 96 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.orange800 },
  addButton: {
    backgroundColor: Colors.orange200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addButtonText: { color: Colors.orange800, fontWeight: '700', fontSize: 14 },

  errorBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorText: { color: '#856404', fontSize: 13, fontWeight: '600' },

  loadingContainer: { alignItems: 'center', paddingVertical: 56 },
  loadingText: { marginTop: 12, color: Colors.orange200, fontSize: 14, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  summaryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  summaryChipText: { fontSize: 12, fontWeight: '700' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.yellow200,
  },
  filterBtnActive: { backgroundColor: Colors.orange200, borderColor: Colors.orange200 },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: Colors.orange800 },
  filterBtnTextActive: { color: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.orange200, fontSize: 15, fontWeight: '600', marginBottom: 16 },
  emptyAddBtn: {
    backgroundColor: Colors.orange200,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: { color: Colors.orange800, fontWeight: '700', fontSize: 14 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff8e1', borderWidth: 1.5, borderColor: Colors.yellow200,
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  taskCardCompleted: { backgroundColor: Colors.successLight, borderColor: '#aed581' },
  checkButton: { marginRight: 12, width: 28, alignItems: 'center' },
  checkIcon: { fontSize: 22 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: Colors.orange800, marginBottom: 4 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#aaa' },
  taskMeta: { fontSize: 12, color: Colors.orange200, marginTop: 2 },
  deleteButton: { marginLeft: 8, padding: 6 },
  deleteIcon: { fontSize: 18 },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#e0e0e0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22, fontWeight: '700',
    color: Colors.orange800, marginBottom: 20,
  },
  formErrorBanner: {
    backgroundColor: '#fff3cd', borderRadius: 10, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: '#ffc107',
  },
  formErrorText: { color: '#856404', fontSize: 13 },

  inputLabel: {
    fontSize: 13, fontWeight: '700',
    color: Colors.orange800, marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5, borderColor: Colors.yellow200,
    borderRadius: 12, padding: 12,
    fontSize: 15, color: Colors.orange800,
    backgroundColor: '#fffde7',
    marginBottom: 16,
  },

  planScrollRow: { marginBottom: 20 },
  planChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5,
    borderColor: Colors.yellow200, backgroundColor: '#fffde7',
    maxWidth: 180,
  },
  planChipSelected: {
    backgroundColor: Colors.orange200,
    borderColor: Colors.orange200,
  },
  planChipText: { fontSize: 13, fontWeight: '600', color: Colors.orange800 },
  planChipTextSelected: { color: '#fff' },

  noPlansBanner: {
    backgroundColor: Colors.pink50, borderRadius: 12,
    padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.borderPink,
  },
  noPlansText: { color: Colors.primary, fontSize: 13, lineHeight: 20 },

  modalButtons: {
    flexDirection: 'row', gap: 12, marginTop: 4,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: Colors.pink50,
    borderWidth: 1.5, borderColor: Colors.borderPink,
  },
  cancelBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: Colors.orange800,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
