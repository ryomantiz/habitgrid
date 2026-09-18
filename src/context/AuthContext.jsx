import { createContext } from 'react'

export const AuthContext = createContext({
  token: '',
  setToken: () => {},
  user: null,
  setUser: () => {},
})
