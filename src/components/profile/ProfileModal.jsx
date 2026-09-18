import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import { updateProfile, changePassword, logout } from '../../api/auth'

export default function ProfileModal({ open, onClose, toast }) {
  const { token, user, setUser, setToken } = useContext(AuthContext)
  const [name, setName] = useState('')
  const [pic, setPic] = useState('')
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')

  useEffect(() => {
    if (open && user) {
      setName(user.name || '')
      setPic(user.pic || '')
    }
  }, [open, user])

  async function handleSaveProfile() {
    try {
      const res = await updateProfile(token, name.trim(), pic.trim())
      setUser(res.user)
      toast('Profile saved ✔')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed to save'))
    }
  }

  async function handleChangePass() {
    if (!curPass || !newPass) {
      toast('Fill in both password fields')
      return
    }
    try {
      await changePassword(token, curPass, newPass)
      setCurPass('')
      setNewPass('')
      toast('Password updated 🔒')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed to update password'))
    }
  }

  async function handleLogout() {
    try { await logout(token) } catch (e) {}
    setToken('')
    setUser(null)
    localStorage.removeItem('hg_token')
    onClose()
  }

  if (!user) return null

  return (
    <Modal open={open} onClose={onClose} title="Your profile">
      <div className="pf-top">
        <div className="pf-avatar">
          {user.pic ? (
            <img src={user.pic} alt="" style={{ width: 64, height: 64, objectFit: 'cover' }} />
          ) : (
            <div className="av av-init" style={{ width: 64, height: 64, fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(user.name || user.username || '?')[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <div className="pf-uname">@{user.username}</div>
          <div className="pf-hint">username can't be changed</div>
        </div>
      </div>

      <label>Display name</label>
      <input type="text" maxLength="30" value={name} onChange={(e) => setName(e.target.value)} />

      <label>Profile picture URL</label>
      <input type="text" placeholder="https://… .jpg .jpeg .png .gif .webp .webm" value={pic} onChange={(e) => setPic(e.target.value)} />
      <div className="pf-hint">Direct image link — .webm plays as a looping video avatar.</div>

      <button className="btn btn-primary btn-block" onClick={handleSaveProfile}>Save profile</button>

      <div className="pf-divider">change password</div>

      <label>Current password</label>
      <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} autoComplete="current-password" />

      <label>New password</label>
      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" />

      <button className="btn btn-ghost btn-block" onClick={handleChangePass}>Update password</button>
      <button className="btn-logout" onClick={handleLogout}>Log out</button>
    </Modal>
  )
}
