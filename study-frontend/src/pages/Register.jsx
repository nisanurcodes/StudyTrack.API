import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const DECORATIONS = ['🌟', '🎯', '💡', '🦋', '🌈', '⭐', '🎀']

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor 🥺')
      return
    }

    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı!')
      return
    }

    setLoading(true)

    try {
      await axios.post(
        'https://studytrack-api-nu1x.onrender.com/api/Auth/register',
        {
          name: form.username,
          email: form.email,
          password: form.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      setSuccess('Hesabın oluşturuldu! 🎉')

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      console.error('REGISTER ERROR:', err)

      if (err.response?.status === 409) {
        setError('Bu e-posta zaten kullanılıyor 😅')
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Girilen bilgiler geçersiz.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Sunucuya bağlanılamadı 🤔')
      } else {
        setError('Kayıt sırasında bir hata oluştu!')
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
        padding: '24px 16px',
        background:
          'linear-gradient(135deg, #e8f4fd 0%, #f8e8ff 50%, #fce4ec 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {DECORATIONS.map((emoji, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: `${8 + ((i * 13) % 82)}%`,
            left: `${3 + ((i * 15) % 91)}%`,
            fontSize: '24px',
            opacity: 0.3,
            pointerEvents: 'none',
            userSelect: 'none',
            animation: `float ${2.5 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {emoji}
        </span>
      ))}

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 2 }}>
        <div
          style={{
            borderRadius: '28px',
            padding: '32px 24px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(18px)',
            border: '2px solid rgba(206,147,216,0.3)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎯</div>

            <h1
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '36px',
                color: '#6a1b9a',
                margin: 0,
              }}
            >
              StudyTrack
            </h1>

            <p style={{ color: '#ab47bc', fontSize: '14px', marginTop: '8px' }}>
              Yeni hesap oluştur! 🌟
            </p>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: '#fce4ec',
                color: '#c62828',
                border: '1.5px solid #f48fb1',
                fontSize: '14px',
              }}
            >
              💔 {error}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                background: '#e8f5e9',
                color: '#2e7d32',
                border: '1.5px solid #a5d6a7',
                fontSize: '14px',
              }}
            >
              🎉 {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <input
                type="text"
                name="username"
                placeholder="Kullanıcı adı"
                value={form.username}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <input
                type="email"
                name="email"
                placeholder="E-posta"
                value={form.email}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Şifre"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, paddingRight: '52px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '18px',
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Şifre tekrar"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: loading
                    ? '#ce93d8'
                    : 'linear-gradient(135deg, #ba68c8, #8e24aa)',
                  color: 'white',
                  fontWeight: 700,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '18px',
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? 'Kayıt yapılıyor...' : '🎀 Hesap Oluştur'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', color: '#7b1fa2' }}>
            Zaten hesabın var mı?{' '}
            <Link to="/login" style={{ color: '#8e24aa', fontWeight: 700 }}>
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}