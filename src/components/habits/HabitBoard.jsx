import { useState, useRef } from 'react'
import { diffDays } from '../../utils/dates'

export default function HabitBoard({ habits, toast, onAdd, onExtend }) {
  const [armedDel, setArmedDel] = useState(null)
  const armTimer = useRef(null)
  const today = habits.today
  const activeList = habits.activeHabits()

  function handleDelete(id) {
    if (armedDel !== id) {
      setArmedDel(id)
      if (armTimer.current) clearTimeout(armTimer.current)
      armTimer.current = setTimeout(() => setArmedDel(null), 2600)
      return
    }
    habits.deleteHabit(id).then(() => {
      toast('Habit removed 🗑️')
      setArmedDel(null)
    }).catch(() => {})
  }

  return (
    <section className="card" style={{ animationDelay: '0.15s' }}>
      <h2>
        Progress board
        <span className="ci-count">{activeList.length} habit{activeList.length === 1 ? '' : 's'}</span>
      </h2>
      <div className="hlist">
        {activeList.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">🗒️</div>
            <p><b>Your board is empty.</b><br />Add a habit and set a goal — 21, 66 or the classic 100 days.</p>
            <button className="btn btn-primary" onClick={onAdd}>＋ Create a habit</button>
          </div>
        ) : (
          activeList.map(h => {
            const dayNo = diffDays(h.start, today) + 1
            const complete = h.status === 'done'

            let meta
            if (dayNo < 1) {
              meta = <span>Starts {new Date(h.start + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            } else {
              meta = (
                <>
                  <span>Day <b>{Math.min(dayNo, h.target)}</b> of {h.target}</span>
                  <i>·</i>
                  <span>{h.done} done</span>
                  <i>·</i>
                  <span className={`flame ${h.streak === 0 ? 'zero' : h.streak >= 3 ? 'hot' : ''}`}>🔥 {h.streak} streak</span>
                </>
              )
            }

            return (
              <article key={h.id} className={`habit ${complete ? 'complete' : ''}`} style={{ '--hc': h.color }}>
                <div className="h-emoji">{h.emoji}</div>
                <div className="h-body">
                  <div className="h-line1">
                    <h3>{h.name}</h3>
                    <span className="pct" style={{ color: h.color }}>{h.pct}<small>%</small></span>
                  </div>
                  <div className="h-meta">{meta}</div>
                  <div className="bar">
                    <i data-w={h.pct} style={{ width: `${h.pct}%`, background: h.color }} />
                    <u style={{ left: '25%' }} />
                    <u style={{ left: '50%' }} />
                    <u style={{ left: '75%' }} />
                  </div>
                  {complete ? (
                    <div className="done-banner">
                      🏁 <b>{h.target}/{h.target} days — goal complete!</b>
                      <span className="sp" />
                      <button className="mini gold" onClick={() => onExtend(h.id)}>Keep going ＋days</button>
                      <button
                        className={`mini del2 ${armedDel === h.id ? 'armed' : ''}`}
                        onClick={() => handleDelete(h.id)}
                      >
                        {armedDel === h.id ? 'Sure?' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div className="h-actions">
                      <button className="iconbtn" onClick={() => onExtend(h.id)} title="Extend goal">＋</button>
                      <button
                        className={`iconbtn del ${armedDel === h.id ? 'armed' : ''}`}
                        onClick={() => handleDelete(h.id)}
                        title="Delete habit"
                      >
                        {armedDel === h.id ? 'Sure?' : '🗑'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
      {activeList.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={onAdd}>＋ New habit</button>
        </div>
      )}
    </section>
  )
}
