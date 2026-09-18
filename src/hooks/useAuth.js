import { useState, useContext, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { login as apiLogin, signup as apiSignup, logout as apiLogout, bootstrap as apiBootstrap } from '../api/auth'

export default function useAuth() {
  const { token, setToken, user, setUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiLogin(username, password)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('hg_token', res.token)
      return res
    } catch (e) {
      setError(e.message || 'Login failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [setToken, setUser])

  const signup = useCallback(async (username, displayName, pic, password) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiSignup(username, displayName, pic, password)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('hg_token', res.token)
      return res
    } catch (e) {
      setError(e.message || 'Signup failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [setToken, setUser])

  const logout = useCallback(async () => {
    try {
      await apiLogout(token)
    } catch (e) {}
    setToken('')
    setUser(null)
    localStorage.removeItem('hg_token')
  }, [token, setToken, setUser])

  const checkSession = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const res = await apiBootstrap(token)
      setUser(res.user)
      return res
    } catch (e) {
      if (e.message === 'AUTH') {
        setToken('')
        setUser(null)
        localStorage.removeItem('hg_token')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [token, setToken, setUser])

  return { token, user, loading, error, login, signup, logout, checkSession }
}
