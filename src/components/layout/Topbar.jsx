import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'

export default function Topbar({ onProfileClick }) {
  const { user } = useContext(AuthContext)

  return (
    <header className="topbar">
      <div className="brand">
        <span className="mark">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
        HabitGrid
      </div>
      <div className="top-actions">
        <button className="avatar-chip" onClick={onProfileClick} title="Your profile">
          <span id="avatarSlot">
            {user?.pic ? (
              <img src={user.pic} alt="" className="av" style={{ width: 30, height: 30 }} />
            ) : (
              <span className="av av-init" style={{ width: 30, height: 30, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(user?.name || user?.username || '?')[0]?.toUpperCase() || '?'}
              </span>
            )}
          </span>
          <span className="nm">{user?.name || user?.username}</span>
        </button>
      </div>
    </header>
  )
}
