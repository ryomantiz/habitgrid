import { useState, useCallback } from 'react'

let toastTimer = null

export default function useToast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const toast = useCallback((msg, duration = 2800) => {
    setMessage(msg)
    setVisible(true)
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setVisible(false), duration)
  }, [])

  return { message, visible, toast }
}
