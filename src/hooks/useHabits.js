import { useState, useCallback, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { addHabit as apiAdd, toggleDone as apiToggle, saveNote as apiSaveNote, extendHabit as apiExtend, deleteHabit as apiDelete } from '../api/habits'
import { bootstrap as apiBootstrap } from '../api/auth'
import { todayStr, formatLocal, parseDate, diffDays } from '../utils/dates'

export default function useHabits() {
  const { token } = useContext(AuthContext)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const bootstrap = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const res = await apiBootstrap(token)
      setData(res)
      return res
    } catch (e) {
      throw e
    } finally {
      setLoading(false)
    }
  }, [token])

  const addHabit = useCallback(async (name, emoji, color, target, start) => {
    const res = await apiAdd(token, name, emoji, color, target, start)
    setData(res)
    return res
  }, [token])

  const toggleDone = useCallback(async (habitId, date, done) => {
    const res = await apiToggle(token, habitId, date, done)
    setData(res)
    return res
  }, [token])

  const saveNote = useCallback(async (habitId, date, note) => {
    const res = await apiSaveNote(token, habitId, date, note)
    setData(res)
    return res
  }, [token])

  const extendHabit = useCallback(async (habitId, days) => {
    const res = await apiExtend(token, habitId, days)
    setData(res)
    return res
  }, [token])

  const deleteHabit = useCallback(async (habitId) => {
    const res = await apiDelete(token, habitId)
    setData(res)
    return res
  }, [token])

  const activeHabits = useCallback(() => {
    if (!data) return []
    return data.habits.filter(h => h.status !== 'archived')
  }, [data])

  const logFor = useCallback((date, habitId) => {
    if (!data) return { done: false, note: '' }
    return (data.logs[date] && data.logs[date][habitId]) || { done: false, note: '' }
  }, [data])

  return {
    data,
    loading,
    bootstrap,
    addHabit,
    toggleDone,
    saveNote,
    extendHabit,
    deleteHabit,
    activeHabits,
    logFor,
    today: data?.today || todayStr(),
  }
}
