import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <button
      className="iconbtn"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{ fontSize: '16px' }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
