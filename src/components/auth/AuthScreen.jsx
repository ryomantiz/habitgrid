import { useState, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { signup, login } from '../../api/auth'
import AuthForm from './AuthForm'
import './auth.css'

export default function AuthScreen() {
  const { setToken, setUser } = useContext(AuthContext)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth(mode, username, displayName, pic, password) {
    setError('')
    setLoading(true)

    try {
      let res
      if (mode === 'signup') {
        res = await signup(username, displayName, pic, password)
      } else {
        res = await login(username, password)
      }

      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('hg_token', res.token)
    } catch (e) {
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div className="auth-brand">
          <span className="mark">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          </span>
          <span className="auth-title">HabitGrid</span>
        </div>
        <p className="auth-sub">Small days, stacked. Your own grid — your own data.</p>
        
        <AuthForm onAuth={handleAuth} error={error} loading={loading} />

        <div className="demo-hint">☁️ Powered by Cloudflare D1 · sessions last 30 days</div>
      </div>
    </div>
  )
}
