import { useState } from 'react'
import Modal from '../ui/Modal'
import { todayStr } from '../../utils/dates'

const EMOJIS = ['🌱', '💧', '📖', '🏃', '🧘', '💪', '✍️', '🥗', '😴', '🧠', '💻', '🎨', '🎸', '🌿', '☀️', '🚴', '🙏', '🗂️']
const COLORS = ['#1f8a5b', '#2f80c3', '#e0762f', '#c94f7c', '#7b6cd9', '#0f8b8d']
const TARGETS = [21, 30, 66, 100, 365]

export default function AddHabitModal({ open, onClose, habits, toast }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [color, setColor] = useState('#1f8a5b')
  const [target, setTarget] = useState(100)
  const [start, setStart] = useState(habits.today || todayStr())
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      toast('Give your habit a name ✏️')
      return
    }
    setLoading(true)
    try {
      await habits.addHabit(name.trim(), emoji, color, target, start || habits.today)
      toast(`"${name.trim()}" started — day 1 🌱`)
      setName('')
      setEmoji('🌱')
      setColor('#1f8a5b')
      setTarget(100)
      onClose()
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed to create habit'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Plant a new habit 🌱">
      <label>Name</label>
      <input
        type="text"
        maxLength="60"
        placeholder="e.g. Read 20 minutes"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
      />

      <label>Icon</label>
      <div className="emoji-row">
        {EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            className={emoji === e ? 'sel' : ''}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <label>Color</label>
      <div className="swatch-row">
        {COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`swatch ${color === c ? 'sel' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <label>Goal — how many days?</label>
      <div className="goal-row">
        <input
          type="number"
          min="1"
          max="3650"
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value, 10) || 100)}
        />
        <div className="chips">
          {TARGETS.map(v => (
            <button key={v} type="button" className="chipbtn" onClick={() => setTarget(v)}>
              {v} days
            </button>
          ))}
        </div>
      </div>

      <label>Start date</label>
      <input
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      <button
        className="btn btn-primary btn-block"
        onClick={handleCreate}
        disabled={loading}
      >
        Start tracking →
      </button>
    </Modal>
  )
}
