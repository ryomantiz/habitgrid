import { useCallback } from 'react'

export default function useLocalStorage(key, initialValue) {
  const getValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  }, [key])

  const setValue = useCallback((value) => {
    try {
      const val = typeof value === 'function' ? value(getValue()) : value
      localStorage.setItem(key, JSON.stringify(val))
      return val
    } catch {
      return initialValue
    }
  }, [key, getValue, initialValue])

  return [getValue(), setValue]
}
