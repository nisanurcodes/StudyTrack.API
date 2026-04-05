import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

const DECORATIONS = ['✨', '🌸', '📚', '⭐', '🎀', '💫', '🌙', '🍓']

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/Auth/login', {
        email: form.email,
        password: form.password,
      })

      const token =
        response.data.token ||
        response.data.Token ||
        response.data.accessToken

      if (token) {
        localStorage.setItem('token', token)
        navigate('/dashboard')
      } else {
        setError('Token alınamadı, lütfen tekrar deneyin.')
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('E-posta veya şifre hatalı 🥺')
      } else if (err.response?.status === 404) {
        setError('Login endpoint bulunamadı ❌')
      } else if (err.response?.status === 500) {
        setError('Sunucuda bir hata oluştu. JWT ayarlarını kontrol et.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Sunucuya bağlanılamadı 🤔')
      } else {
        setError('Bir şeyler ters gitti, tekrar dene!')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    outline: 'none',
    background: '#fff0f5',
    border: '2px solid #f8bbd9',
    color: '#4a0020',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 16px',
        boxSizing: 'border-box',
        background:
          'linear-gradient(135deg, #fce4ec 0%, #f8e8ff 50%, #e8f4fd 100%)',
      }}
    >
      {DECORATIONS.map((emoji, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: `${10 + ((i * 11) % 80)}%`,
            left: `${5 + ((i * 13) % 90)}%`,
            pointerEvents: 'none',
            userSelect: 'none',
            fontSize: '24px',
            opacity: 0.35,
            animation: `float ${2.5 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {emoji}
        </span>
      ))}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
        }}
      >
        <div
          style={{
            borderRadius: '28px',
            padding: '32px 24px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.10)',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(18px)',
            border: '2px solid rgba(244, 143, 177, 0.28)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>📚</div>

            <h1
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '40px',
                color: '#d81b60',
                margin: 0,
              }}
            >
              StudyTrack
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: '#f06292',
                marginTop: '8px',
                marginBottom: 0,
              }}
            >
              Hedeflerine doğru adım at! 🌟
            </p>
          </div>

          <h2
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '28px',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#880e4f',
            }}
          >
            Tekrar hoş geldin~
          </h2>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '16px',
                background: '#fce4ec',
                color: '#c62828',
                fontSize: '14px',
              }}
            >
              💔 {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="ornek@mail.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />

            <div style={{ position: 'relative', marginTop: '12px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{ ...inputStyle, paddingRight: '90px' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#c2185b',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {showPassword ? 'Gizle' : 'Göster'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: '#e91e8c',
                color: 'white',
                fontWeight: 700,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', color: '#6a1b4d' }}>
            Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}