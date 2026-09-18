import { useState, useEffect } from 'react'
import { AuthContext } from './context/AuthContext'
import { ThemeContext } from './context/ThemeContext'
import AuthScreen from './components/auth/AuthScreen'
import AppLayout from './components/layout/AppLayout'
import './styles/global.css'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hg_token') || '')
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('hg_theme') || 'light')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hg_theme', theme)
  }, [theme])

  useEffect(() => {
    if (token) {
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [token])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ token, setToken, user, setUser }}>
        {loading ? (
          <div id="loader">
            <div className="l-box">
              <div className="l-mark">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.2 4.2L19 7" />
                </svg>
              </div>
              <p>Opening your grid…</p>
            </div>
          </div>
        ) : token ? (
          <AppLayout />
        ) : (
          <AuthScreen />
        )}
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
