import { useState } from 'react'
import Modal from '../ui/Modal'

const EXTEND_TARGETS = [7, 21, 30, 66, 100]

export default function ExtendModal({ open, onClose, habitId, habits, toast }) {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)

  const h = habits.data?.habits?.find(x => x.id === habitId)
  if (!h) return null

  async function handleExtend() {
    if (!days || days < 1) {
      toast('Enter how many days to add')
      return
    }
    setLoading(true)
    try {
      await habits.extendHabit(habitId, days)
      toast(`Goal extended by ${days} days 🚀`)
      onClose()
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed to extend'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Extend goal 🚀">
      <p style={{ marginTop: 6, fontSize: 14 }}>
        {h.emoji} {h.name} — currently {h.done}/{h.target} days ({h.pct}%)
      </p>

      <label>Days to add</label>
      <div className="goal-row">
        <input
          type="number"
          min="1"
          max="3650"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
        />
        <div className="chips">
          {EXTEND_TARGETS.map(v => (
            <button key={v} type="button" className="chipbtn" onClick={() => setDays(v)}>
              +{v}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={handleExtend}
        disabled={loading}
      >
        Add days →
      </button>
    </Modal>
  )
}
