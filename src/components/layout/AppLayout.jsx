import { useState, useEffect, useCallback } from 'react'
import Topbar from './Topbar'
import TabBar from './TabBar'
import HabitsView from '../habits/HabitsView'
import NotesView from '../notes/NotesView'
import ProfileModal from '../profile/ProfileModal'
import ThemeToggle from '../ui/ThemeToggle'
import Toast from '../ui/Toast'
import useHabits from '../../hooks/useHabits'
import useNotes from '../../hooks/useNotes'
import useToast from '../../hooks/useToast'

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('habits')
  const [profileOpen, setProfileOpen] = useState(false)
  const habits = useHabits()
  const notes = useNotes()
  const { message: toastMsg, visible: toastVisible, toast } = useToast()

  useEffect(() => {
    habits.bootstrap()
    notes.bootstrap()
  }, [])

  return (
    <div id="app">
      <Topbar onProfileClick={() => setProfileOpen(true)} />

      <section className="hero">
        <div>
          <div className="dow">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</div>
          <div className="date-big">
            <em>{new Date().getDate()}</em> {new Date().toLocaleDateString(undefined, { month: 'long' })}
          </div>
          <div className="tagline">Small days, stacked. Check them off, watch the bars grow.</div>
        </div>
        <div className="stats">
          <ThemeToggle />
        </div>
      </section>

      <div className="tab-container">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'habits' ? (
        <HabitsView habits={habits} toast={toast} />
      ) : (
        <NotesView notes={notes} toast={toast} />
      )}

      <footer>Your data lives in <b>Cloudflare D1</b> · sessions last 30 days</footer>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        toast={toast}
      />

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  )
}
