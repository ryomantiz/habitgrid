import { apiCall } from './client'

export async function signup(username, displayName, pic, password) {
  const data = await apiCall('/api/signup', {
    username,
    displayName,
    pic,
    password,
  })
  return data
}

export async function login(username, password) {
  const data = await apiCall('/api/login', {
    username,
    password,
  })
  return data
}

export async function logout(token) {
  try {
    await apiCall('/api/logout', {}, token)
  } catch (e) {
    // Silent fail for logout
  }
}

export async function bootstrap(token) {
  const data = await apiCall('/api/bootstrap', {}, token)
  return data
}

export async function updateProfile(token, displayName, pic) {
  const data = await apiCall('/api/profile/update', { displayName, pic }, token)
  return data
}

export async function changePassword(token, currentPass, newPass) {
  const data = await apiCall(
    '/api/profile/password',
    { currentPass, newPass },
    token
  )
  return data
}
