import { apiCall } from './client'

export async function addHabit(token, name, emoji, color, target, start) {
  const data = await apiCall(
    '/api/habit/add',
    { name, emoji, color, target, start },
    token
  )
  return data
}

export async function toggleDone(token, habitId, date, done) {
  const data = await apiCall(
    '/api/habit/toggle',
    { habitId, date, done },
    token
  )
  return data
}

export async function saveNote(token, habitId, date, note) {
  const data = await apiCall(
    '/api/habit/note',
    { habitId, date, note },
    token
  )
  return data
}

export async function extendHabit(token, habitId, days) {
  const data = await apiCall(
    '/api/habit/extend',
    { habitId, days },
    token
  )
  return data
}

export async function deleteHabit(token, habitId) {
  const data = await apiCall(
    '/api/habit/delete',
    { habitId },
    token
  )
  return data
}

export async function renameHabit(token, habitId, name) {
  const data = await apiCall(
    '/api/habit/rename',
    { habitId, name },
    token
  )
  return data
}
