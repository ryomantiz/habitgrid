import { useMemo, useRef } from 'react'
import { parseDate } from '../../utils/dates'

export default function CheckinPanel({ habits, selDate, toast }) {
  const today = habits.today
  const noteTimers = useRef({})

  const d = parseDate(selDate)
  const isFuture = selDate > today
  const activeList = habits.activeHabits()

  const doneN = useMemo(() =>
    activeList.filter(h => habits.logFor(selDate, h.id).done).length,
    [activeList, selDate, habits]
  )

  function handleToggle(id, e) {
    const log = habits.logFor(selDate, id)
    habits.toggleDone(id, selDate, !log.done).then(() => {
      const after = habits.data?.habits?.find(h => h.id === id)
      if (!log.done && after && after.pct >= 100) {
        toast('🏁 "' + after.name + '" — ' + after.target + ' days complete!')
      } else if (!log.done && selDate === today) {
        const act = habits.activeHabits()
        if (act.length > 1 && act.every(h => habits.logFor(today, h.id).done)) {
          toast('🎉 All habits done today — perfect day!')
        }
      }
    }).catch(() => {})
  }

  function handleNoteChange(id, value) {
    if (noteTimers.current[id]) clearTimeout(noteTimers.current[id])
    noteTimers.current[id] = setTimeout(() => {
      habits.saveNote(id, selDate, value)
    }, 1000)
  }

  return (
    <section className="card" style={{ animationDelay: '0.08s' }}>
      <h2>
        Check-in · <span>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span className="badge-today" style={{ display: selDate === today ? '' : 'none' }}>TODAY</span>
          <span className="ci-count">{activeList.length ? `${doneN}/${activeList.length}` : '0/0'}</span>
        </span>
      </h2>

      <div className="future-note" style={{ display: isFuture ? 'block' : 'none' }}>
        ⏳ This day hasn't arrived yet — check back soon.
      </div>

      <div id="ciList">
        {activeList.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">🌱</div>
            <p><b>No habits yet.</b><br />Plant your first one — it takes 10 seconds.</p>
          </div>
        ) : (
          activeList.map(h => {
            const log = habits.logFor(selDate, h.id)
            return (
              <div key={h.id} className={`ci ${log.done ? 'is-done' : ''}`} style={{ '--hc': h.color }}>
                <button
                  className={`tick ${log.done ? 'on' : ''}`}
                  onClick={(e) => handleToggle(h.id, e)}
                  disabled={isFuture}
                  title="Toggle done"
                  style={{ '--hc': h.color }}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.2 4.2L19 7" />
                  </svg>
                </button>
                <div className="ci-main">
                  <div className="ci-top">
                    <span className="ci-name">{h.emoji} {h.name}</span>
                    {log.done && <span className="tag-done">done</span>}
                  </div>
                  <input
                    key={selDate + '-' + h.id}
                    className="note"
                    maxLength="300"
                    placeholder="Add a note for this day…"
                    defaultValue={log.note}
                    disabled={isFuture}
                    onChange={(e) => handleNoteChange(h.id, e.target.value)}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
