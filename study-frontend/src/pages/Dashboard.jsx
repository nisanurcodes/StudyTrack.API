import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import api from '../api/axios'

export default function Dashboard() {
  const navigate = useNavigate()

  const [plans, setPlans] = useState([])
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [motivationMessage, setMotivationMessage] = useState('')
  const [streak, setStreak] = useState(0)

  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [updatingPlan, setUpdatingPlan] = useState(false)

  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Active',
  })

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [savingGoal, setSavingGoal] = useState(false)
  const [updatingGoal, setUpdatingGoal] = useState(false)

  const [newGoal, setNewGoal] = useState({
    title: '',
    targetHours: 0,
    deadline: '',
    isAchieved: false,
  })

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [savingTask, setSavingTask] = useState(false)
  const [updatingTask, setUpdatingTask] = useState(false)

  const [newTask, setNewTask] = useState({
    planId: '',
    title: '',
    dueDate: '',
    isCompleted: false,
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Günaydın')
    else if (hour < 18) setGreeting('İyi günler')
    else setGreeting('İyi akşamlar')

    const messages = [
      'Bugün küçük bir adım at 🌷',
      'Az ama düzenli ilerleme çok güçlüdür ✨',
      'Bir görev bile başarıdır 💖',
      'Odaklan, başaracaksın 🎯',
      'Küçük adımlar büyük sonuçlar doğurur 🌸',
      'Bugün kendin için güzel bir şey yap: ilerle 💫',
    ]
    setMotivationMessage(messages[Math.floor(Math.random() * messages.length)])

    const savedStreak = Number(localStorage.getItem('study_streak') || '0')
    setStreak(savedStreak)

    fetchData()
  }, [])

  const sparklePositions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: `${6 + ((i * 9) % 82)}%`,
        left: `${4 + ((i * 13) % 88)}%`,
        size: `${16 + (i % 3) * 4}px`,
      })),
    []
  )

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, goalsRes, tasksRes] = await Promise.allSettled([
        api.get('/Plans'),
        api.get('/Goals'),
        api.get('/Tasks'),
      ])

      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data || [])
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.data || [])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlan = async (e) => {
    e.preventDefault()

    if (!newPlan.title || !newPlan.startDate || !newPlan.endDate) {
      alert('Lütfen plan için gerekli alanları doldur 🌸')
      return
    }

    setSavingPlan(true)
    try {
      await api.post('/Plans', {
        title: newPlan.title,
        description: newPlan.description || '',
        startDate: new Date(newPlan.startDate).toISOString(),
        endDate: new Date(newPlan.endDate).toISOString(),
        status: newPlan.status,
      })

      setNewPlan({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Active',
      })
      setShowPlanForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Plan eklenemedi 😢')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleUpdatePlan = async (e) => {
    e.preventDefault()

    if (!editingPlan?.id) {
      alert('Plan bilgisi bulunamadı 😢')
      return
    }

    if (!editingPlan.title || !editingPlan.startDate || !editingPlan.endDate) {
      alert('Lütfen gerekli alanları doldur 🌸')
      return
    }

    setUpdatingPlan(true)
    try {
      await api.put(`/Plans/${editingPlan.id}`, {
        title: editingPlan.title,
        description: editingPlan.description || '',
        startDate: new Date(editingPlan.startDate).toISOString(),
        endDate: new Date(editingPlan.endDate).toISOString(),
        status: editingPlan.status || 'Active',
      })

      setEditingPlan(null)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Plan güncellenemedi 😢')
    } finally {
      setUpdatingPlan(false)
    }
  }

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Bu planı silmek istiyor musun?')) return

    try {
      await api.delete(`/Plans/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Plan silinemedi 😢')
    }
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()

    if (!newGoal.title || !newGoal.deadline) {
      alert('Lütfen hedef bilgilerini doldur 🌸')
      return
    }

    setSavingGoal(true)
    try {
      await api.post('/Goals', {
        title: newGoal.title,
        targetHours: Number(newGoal.targetHours),
        deadline: new Date(newGoal.deadline).toISOString(),
        isAchieved: newGoal.isAchieved,
      })

      setNewGoal({
        title: '',
        targetHours: 0,
        deadline: '',
        isAchieved: false,
      })
      setShowGoalForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Hedef eklenemedi 😢')
    } finally {
      setSavingGoal(false)
    }
  }

  const handleUpdateGoal = async (e) => {
    e.preventDefault()

    if (!editingGoal?.id) {
      alert('Hedef bilgisi bulunamadı 😢')
      return
    }

    if (!editingGoal.title || !editingGoal.deadline) {
      alert('Lütfen gerekli alanları doldur 🌸')
      return
    }

    setUpdatingGoal(true)
    try {
      await api.put(`/Goals/${editingGoal.id}`, {
        title: editingGoal.title,
        targetHours: Number(editingGoal.targetHours),
        deadline: new Date(editingGoal.deadline).toISOString(),
        isAchieved: editingGoal.isAchieved,
      })

      setEditingGoal(null)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Hedef güncellenemedi 😢')
    } finally {
      setUpdatingGoal(false)
    }
  }

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Bu hedefi silmek istiyor musun?')) return

    try {
      await api.delete(`/Goals/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Hedef silinemedi 😢')
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()

    if (!newTask.title || !newTask.dueDate || !newTask.planId) {
      alert('Lütfen görev bilgilerini doldur 🌸')
      return
    }

    setSavingTask(true)
    try {
      await api.post('/Tasks', {
        planId: Number(newTask.planId),
        title: newTask.title,
        dueDate: new Date(newTask.dueDate).toISOString(),
        isCompleted: newTask.isCompleted,
      })

      setNewTask({
        planId: '',
        title: '',
        dueDate: '',
        isCompleted: false,
      })
      setShowTaskForm(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Görev eklenemedi 😢')
    } finally {
      setSavingTask(false)
    }
  }

  const handleUpdateTask = async (e) => {
    e.preventDefault()

    if (!editingTask?.id) {
      alert('Görev bilgisi bulunamadı 😢')
      return
    }

    if (!editingTask.title || !editingTask.dueDate || !editingTask.planId) {
      alert('Lütfen gerekli alanları doldur 🌸')
      return
    }

    setUpdatingTask(true)
    try {
      await api.put(`/Tasks/${editingTask.id}`, {
        planId: Number(editingTask.planId),
        title: editingTask.title,
        dueDate: new Date(editingTask.dueDate).toISOString(),
        isCompleted: editingTask.isCompleted,
      })

      setEditingTask(null)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Görev güncellenemedi 😢')
    } finally {
      setUpdatingTask(false)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Bu görevi silmek istiyor musun?')) return

    try {
      await api.delete(`/Tasks/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Görev silinemedi 😢')
    }
  }

  const handleToggleTaskCompletion = async (task) => {
    try {
      await api.put(`/Tasks/${task.id}`, {
        planId: Number(task.planId),
        title: task.title,
        dueDate: new Date(task.dueDate).toISOString(),
        isCompleted: !task.isCompleted,
      })
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Görev durumu güncellenemedi 😢')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const completedTasks = tasks.filter((t) => t.isCompleted).length
  const completionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const earnedBadges = Array.from({ length: completedTasks }, (_, i) => ({
    emoji: '🏆',
    label: `Rozet ${i + 1}`,
  }))

  useEffect(() => {
    if (!loading && completedTasks > 0) {
      const savedStreak = Number(localStorage.getItem('study_streak') || '0')
      const newStreak = savedStreak === 0 ? 1 : savedStreak
      localStorage.setItem('study_streak', String(newStreak))
      setStreak(newStreak)
    }
  }, [completedTasks, loading])

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #d1b3ff',
    outline: 'none',
    fontSize: '14px',
    background: 'rgba(255,255,255,0.95)',
    color: '#4a0020',
  }

  const taskPlanTitle = (planId) => {
    const matchedPlan = plans.find((p) => p.id === planId)
    return matchedPlan ? matchedPlan.title : 'Plan bulunamadı'
  }

  const sectionCard = {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
    border: '2px solid rgba(255,255,255,0.4)',
    marginBottom: '24px',
  }

  const statCards = [
    { emoji: '📋', label: 'Planlar', value: plans.length, bg: 'linear-gradient(135deg, #f8bbd0, #f48fb1)', text: '#7a1c4b' },
    { emoji: '🎯', label: 'Hedefler', value: goals.length, bg: 'linear-gradient(135deg, #d1c4e9, #ba68c8)', text: '#4a148c' },
    { emoji: '✅', label: 'Tamamlanan', value: completedTasks, bg: 'linear-gradient(135deg, #b2dfdb, #80cbc4)', text: '#00695c' },
    { emoji: '📝', label: 'Görevler', value: tasks.length, bg: 'linear-gradient(135deg, #fff59d, #ffd54f)', text: '#795548' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #e1bee7 0%, #f8bbd0 45%, #fff59d 100%)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {sparklePositions.map((sparkle) => (
          <span
            key={sparkle.id}
            style={{
              position: 'absolute',
              top: sparkle.top,
              left: sparkle.left,
              opacity: 0.35,
              fontSize: sparkle.size,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      <img
        src="/bunny.png"
        alt="bunny"
        className="float"
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          width: '140px',
          zIndex: 999,
          opacity: 0.95,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 25px rgba(255, 180, 255, 0.6))',
        }}
      />

      <img
        src="/bear.png"
        alt="bear"
        className="float"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '140px',
          zIndex: 999,
          opacity: 0.95,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 25px rgba(255, 220, 150, 0.6))',
        }}
      />

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(255,255,255,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '28px' }}>📚</span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '32px', color: '#7b1fa2' }}>
            StudyTrack
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 16px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff3e0, #fce4ec)',
            color: '#e91e63',
            border: '1.5px solid #f8bbd9',
            cursor: 'pointer',
          }}
        >
          Çıkış 👋
        </button>
      </nav>

      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 20px 40px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            borderRadius: '28px',
            padding: '28px',
            marginBottom: '28px',
            color: 'white',
            background: 'linear-gradient(135deg, #ab47bc, #ffd54f)',
            boxShadow: '0 10px 40px rgba(171,71,188,0.28)',
          }}
        >
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '44px', marginBottom: '10px' }}>
            {greeting}! 🌸
          </h1>

          <p style={{ fontSize: '16px', marginBottom: '16px', opacity: 0.95 }}>
            {motivationMessage}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700 }}>
              🔥 {streak} gün seri
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700 }}>
              🌟 %{completionRate} tamamlandı
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700 }}>
              🏆 {earnedBadges.length} rozet
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '34px', color: '#00695c' }}>🌟 Görev İlerlemen</h2>
              <span style={{ padding: '6px 12px', borderRadius: '999px', background: '#e0f2f1', color: '#00695c', fontWeight: 700 }}>
                %{completionRate}
              </span>
            </div>

            <p style={{ color: '#26a69a', marginBottom: '18px', fontSize: '16px' }}>
              {tasks.length === 0
                ? 'Henüz görev eklemedin 🌸'
                : completionRate === 100
                ? 'Tüm görevleri tamamladın, harikasın 🎉'
                : completionRate >= 70
                ? 'Çok iyi gidiyorsun, az kaldı ✨'
                : completionRate >= 40
                ? 'İlerlemen güzel, devam et 💪'
                : `${completedTasks} / ${tasks.length} görev tamamlandı`}
            </p>

            <div style={{ width: '100%', height: '16px', background: '#d7f3ef', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #80cbc4, #26a69a)',
                }}
              />
            </div>
          </div>

          <div style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '34px', color: '#7b1fa2' }}>🔥 Günlük Seri</h2>
              <span style={{ padding: '6px 12px', borderRadius: '999px', background: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }}>
                {streak} gün
              </span>
            </div>

            <p style={{ color: '#ab47bc', marginBottom: '18px', fontSize: '16px' }}>
              {streak > 0
                ? `Harika! ${streak} gündür ilerliyorsun ✨`
                : 'İlk serini başlatmak için bugün bir görev tamamla 🌷'}
            </p>

            {earnedBadges.length === 0 ? (
              <span
                style={{
                  background: '#fce4ec',
                  color: '#ad1457',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  display: 'inline-block',
                }}
              >
                İlk rozetini kazanmak için bir görev tamamla 💖
              </span>
            ) : (
              <>
                <div
                  style={{
                    background: '#fff3e0',
                    border: '2px solid #ffd54f',
                    color: '#7b1fa2',
                    fontWeight: 700,
                    padding: '10px 14px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    marginBottom: '12px',
                  }}
                >
                  🏆 Toplam Rozet: {earnedBadges.length}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  {earnedBadges.slice(0, 12).map((badge, index) => (
                    <div
                      key={index}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#fff3e0',
                        border: '2px solid #ffd54f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      {badge.emoji}
                    </div>
                  ))}

                  {earnedBadges.length > 12 && (
                    <div
                      style={{
                        minWidth: '42px',
                        height: '42px',
                        borderRadius: '999px',
                        background: '#f3e5f5',
                        color: '#7b1fa2',
                        border: '2px solid #d1c4e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 10px',
                        fontWeight: 700,
                      }}
                    >
                      +{earnedBadges.length - 12}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                borderRadius: '24px',
                padding: '22px',
                textAlign: 'center',
                background: stat.bg,
                border: '2px solid rgba(255,255,255,0.45)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{stat.emoji}</div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '38px', color: stat.text }}>
                {loading ? '~' : stat.value}
              </div>
              <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, color: stat.text }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '34px', color: '#880e4f' }}>📋 Planlarım</h2>
            <button
              onClick={() => {
                setShowPlanForm(!showPlanForm)
                setEditingPlan(null)
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #f48fb1, #e91e8c)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showPlanForm ? '✕ İptal' : '+ Yeni Plan'}
            </button>
          </div>

          {showPlanForm && (
            <form onSubmit={handleAddPlan} style={{ background: '#fff0f5', border: '1.5px solid #f8bbd9', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input type="text" placeholder="Plan başlığı" required value={newPlan.title} onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Açıklama (opsiyonel)" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#880e4f' }}>📅 Başlangıç</label>
                    <input type="date" required value={newPlan.startDate} onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#880e4f' }}>📅 Bitiş</label>
                    <input type="date" required value={newPlan.endDate} onChange={(e) => setNewPlan({ ...newPlan, endDate: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <select value={newPlan.status} onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value })} style={inputStyle}>
                  <option value="Active">🟢 Aktif</option>
                  <option value="Completed">✅ Tamamlandı</option>
                  <option value="Paused">⏸️ Duraklatıldı</option>
                </select>
                <button type="submit" disabled={savingPlan} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f48fb1, #e91e8c)', color: 'white', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>
                  {savingPlan ? 'Kaydediliyor...' : '💾 Kaydet'}
                </button>
              </div>
            </form>
          )}

          {editingPlan && (
            <form onSubmit={handleUpdatePlan} style={{ background: '#fff0f5', border: '1.5px solid #f8bbd9', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#880e4f' }}>✏️ Planı Düzenle</p>
                <input type="text" required value={editingPlan.title || ''} onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })} style={inputStyle} />
                <input type="text" value={editingPlan.description || ''} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <input type="date" required value={editingPlan.startDate?.substring(0, 10) || ''} onChange={(e) => setEditingPlan({ ...editingPlan, startDate: e.target.value })} style={inputStyle} />
                  <input type="date" required value={editingPlan.endDate?.substring(0, 10) || ''} onChange={(e) => setEditingPlan({ ...editingPlan, endDate: e.target.value })} style={inputStyle} />
                </div>
                <select value={editingPlan.status || 'Active'} onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value })} style={inputStyle}>
                  <option value="Active">🟢 Aktif</option>
                  <option value="Completed">✅ Tamamlandı</option>
                  <option value="Paused">⏸️ Duraklatıldı</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={updatingPlan} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f48fb1, #e91e8c)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    {updatingPlan ? 'Güncelleniyor...' : '💾 Güncelle'}
                  </button>
                  <button type="button" onClick={() => setEditingPlan(null)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#fce4ec', color: '#e91e63', fontWeight: 700, cursor: 'pointer' }}>
                    İptal
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>Yükleniyor...</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#f06292' }}>
              Henüz plan yok! İlk planını oluşturmaya ne dersin? 🌸
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: '#fff0f5',
                    border: '1.5px solid #f8bbd9',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <p style={{ fontWeight: 700, color: '#880e4f', marginBottom: '4px' }}>{plan.title || plan.name}</p>
                    {plan.description && <p style={{ fontSize: '13px', color: '#f06292', marginBottom: '4px' }}>{plan.description}</p>}
                    {plan.startDate && plan.endDate && (
                      <p style={{ fontSize: '13px', color: '#f06292', marginBottom: '6px' }}>
                        {new Date(plan.startDate).toLocaleDateString('tr-TR')} - {new Date(plan.endDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        display: 'inline-block',
                        background:
                          plan.status === 'Active'
                            ? '#e8f5e9'
                            : plan.status === 'Completed'
                            ? '#e3f2fd'
                            : '#fff8e1',
                        color:
                          plan.status === 'Active'
                            ? '#2e7d32'
                            : plan.status === 'Completed'
                            ? '#1565c0'
                            : '#f57f17',
                      }}
                    >
                      {plan.status === 'Active'
                        ? '🟢 Aktif'
                        : plan.status === 'Completed'
                        ? '✅ Tamamlandı'
                        : '⏸️ Duraklatıldı'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingPlan(plan); setShowPlanForm(false) }} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#f3e5f5', color: '#8e24aa', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeletePlan(plan.id)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#fce4ec', color: '#e91e63', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '34px', color: '#4a148c' }}>🎯 Hedeflerim</h2>
            <button
              onClick={() => {
                setShowGoalForm(!showGoalForm)
                setEditingGoal(null)
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #ba68c8, #8e24aa)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showGoalForm ? '✕ İptal' : '+ Yeni Hedef'}
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleAddGoal} style={{ background: '#f3e5f5', border: '1.5px solid #e1bee7', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input type="text" placeholder="Hedef başlığı" required value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="Saat hedefi" value={newGoal.targetHours} onChange={(e) => setNewGoal({ ...newGoal, targetHours: e.target.value })} style={inputStyle} />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#4a148c' }}>⏰ Son Tarih</label>
                  <input type="date" required value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4a148c' }}>
                  <input type="checkbox" checked={newGoal.isAchieved} onChange={(e) => setNewGoal({ ...newGoal, isAchieved: e.target.checked })} />
                  Tamamlandı olarak işaretle
                </label>
                <button type="submit" disabled={savingGoal} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ba68c8, #8e24aa)', color: 'white', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>
                  {savingGoal ? 'Ekleniyor...' : '🎯 Hedef Ekle'}
                </button>
              </div>
            </form>
          )}

          {editingGoal && (
            <form onSubmit={handleUpdateGoal} style={{ background: '#f3e5f5', border: '1.5px solid #e1bee7', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#4a148c' }}>✏️ Hedefi Düzenle</p>
                <input type="text" required value={editingGoal.title || ''} onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })} style={inputStyle} />
                <input type="number" value={editingGoal.targetHours || 0} onChange={(e) => setEditingGoal({ ...editingGoal, targetHours: e.target.value })} style={inputStyle} />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#4a148c' }}>⏰ Son Tarih</label>
                  <input type="date" required value={editingGoal.deadline?.substring(0, 10) || ''} onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4a148c' }}>
                  <input type="checkbox" checked={editingGoal.isAchieved || false} onChange={(e) => setEditingGoal({ ...editingGoal, isAchieved: e.target.checked })} />
                  Tamamlandı olarak işaretle
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={updatingGoal} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ba68c8, #8e24aa)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    {updatingGoal ? 'Güncelleniyor...' : '💾 Güncelle'}
                  </button>
                  <button type="button" onClick={() => setEditingGoal(null)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#fce4ec', color: '#e91e63', fontWeight: 700, cursor: 'pointer' }}>
                    İptal
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>Yükleniyor...</div>
          ) : goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ab47bc' }}>
              Henüz hedef yok! Küçük bir hedef bile büyük fark yaratır ✨
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  style={{
                    background: '#f3e5f5',
                    border: '1.5px solid #e1bee7',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <p style={{ fontWeight: 700, color: '#4a148c', marginBottom: '4px' }}>{goal.title || goal.name}</p>
                    {goal.deadline && <p style={{ fontSize: '13px', color: '#ab47bc', marginBottom: '4px' }}>⏰ Son tarih: {new Date(goal.deadline).toLocaleDateString('tr-TR')}</p>}
                    {goal.targetHours > 0 && <p style={{ fontSize: '13px', color: '#ab47bc' }}>🕐 Hedef: {goal.targetHours} saat</p>}
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        display: 'inline-block',
                        background: goal.isAchieved ? '#e8f5e9' : '#fce4ec',
                        color: goal.isAchieved ? '#2e7d32' : '#e91e63',
                      }}
                    >
                      {goal.isAchieved ? '✅ Tamamlandı' : '🎯 Devam ediyor'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingGoal(goal); setShowGoalForm(false) }} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#ede7f6', color: '#7b1fa2', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteGoal(goal.id)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#fce4ec', color: '#e91e63', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '34px', color: '#e65100' }}>📝 Görevlerim</h2>
            <button
              onClick={() => {
                setShowTaskForm(!showTaskForm)
                setEditingTask(null)
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffb74d, #fb8c00)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showTaskForm ? '✕ İptal' : '+ Yeni Görev'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleAddTask} style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <select required value={newTask.planId} onChange={(e) => setNewTask({ ...newTask, planId: e.target.value })} style={inputStyle}>
                  <option value="">Plan seç</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.title}</option>
                  ))}
                </select>
                <input type="text" placeholder="Görev başlığı" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} style={inputStyle} />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#e65100' }}>⏰ Son Tarih</label>
                  <input type="date" required value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e65100' }}>
                  <input type="checkbox" checked={newTask.isCompleted} onChange={(e) => setNewTask({ ...newTask, isCompleted: e.target.checked })} />
                  Tamamlandı olarak işaretle
                </label>
                <button type="submit" disabled={savingTask} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ffb74d, #fb8c00)', color: 'white', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>
                  {savingTask ? 'Ekleniyor...' : '📝 Görev Ekle'}
                </button>
              </div>
            </form>
          )}

          {editingTask && (
            <form onSubmit={handleUpdateTask} style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#e65100' }}>✏️ Görevi Düzenle</p>
                <select required value={editingTask.planId || ''} onChange={(e) => setEditingTask({ ...editingTask, planId: e.target.value })} style={inputStyle}>
                  <option value="">Plan seç</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.title}</option>
                  ))}
                </select>
                <input type="text" required value={editingTask.title || ''} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} style={inputStyle} />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#e65100' }}>⏰ Son Tarih</label>
                  <input type="date" required value={editingTask.dueDate?.substring(0, 10) || ''} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e65100' }}>
                  <input type="checkbox" checked={editingTask.isCompleted || false} onChange={(e) => setEditingTask({ ...editingTask, isCompleted: e.target.checked })} />
                  Tamamlandı olarak işaretle
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={updatingTask} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ffb74d, #fb8c00)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    {updatingTask ? 'Güncelleniyor...' : '💾 Güncelle'}
                  </button>
                  <button type="button" onClick={() => setEditingTask(null)} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#fff3e0', color: '#ef6c00', fontWeight: 700, cursor: 'pointer' }}>
                    İptal
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>Yükleniyor...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ffb74d' }}>
              Henüz görev yok! Bugün için minik bir görev ekleyelim mi? 📝
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: task.isCompleted ? '#f1f8e9' : '#fff8e1',
                    border: task.isCompleted ? '1.5px solid #aed581' : '1.5px solid #ffe082',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '220px' }}>
                    <span style={{ fontSize: '18px' }}>{task.isCompleted ? '✅' : '⭕'}</span>
                    <div>
                      <p style={{ fontWeight: 700, color: '#e65100', textDecoration: task.isCompleted ? 'line-through' : 'none', marginBottom: '4px' }}>
                        {task.title || task.name}
                      </p>
                      <p style={{ fontSize: '13px', color: '#ffb74d', marginBottom: '4px' }}>📚 {taskPlanTitle(task.planId)}</p>
                      {task.dueDate && <p style={{ fontSize: '13px', color: '#ffb74d' }}>⏰ {new Date(task.dueDate).toLocaleDateString('tr-TR')}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleTaskCompletion(task)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: task.isCompleted ? '#fff3e0' : '#e8f5e9',
                        color: task.isCompleted ? '#ef6c00' : '#2e7d32',
                        cursor: 'pointer',
                      }}
                    >
                      {task.isCompleted ? '↩️' : '✅'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingTask(task)
                        setShowTaskForm(false)
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#fff3e0',
                        color: '#ef6c00',
                        cursor: 'pointer',
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#fce4ec',
                        color: '#e91e63',
                        cursor: 'pointer',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}