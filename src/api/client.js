let API_URL = import.meta.env.VITE_API_URL || 'https://habitgrid-api.animecopilot003.workers.dev'

export async function apiCall(path, data = {}, token = '') {
  try {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    })

    let json = {}
    try {
      json = await res.json()
    } catch (e) {}

    if (!res.ok) {
      const error = new Error(json.error || `Server error (${res.status})`)
      error.status = res.status
      throw error
    }

    return json
  } catch (e) {
    if (e.status === 401) {
      const authError = new Error('AUTH')
      authError.status = 401
      throw authError
    }
    throw e
  }
}

export function setApiUrl(url) {
  API_URL = url
}
