import { useState, useMemo } from 'react'
import { parseDate, formatLocal, todayStr } from '../../utils/dates'

export default function Calendar({ habits, selDate, onSelectDate }) {
  const today = habits.today || todayStr()
  const t = parseDate(today)
  const [viewYear, setViewYear] = useState(t.getFullYear())
  const [viewMonth, setViewMonth] = useState(t.getMonth())

  const monthName = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][viewMonth]

  const calendar = useMemo(() => {
    const activeList = habits.activeHabits()
    const startIdx = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate()
    const days = []
    let perfect = 0, perfectable = 0

    for (let i = 0; i < startIdx; i++) days.push({ blank: true })

    for (let d = 1; d <= dim; d++) {
      const ds = formatLocal(new Date(viewYear, viewMonth, d))
      const future = ds > today
      let eligible = 0, done = 0
      activeList.forEach(h => {
        if (h.start <= ds) { eligible++; if (habits.logFor(ds, h.id).done) done++ }
      })
      const r = eligible ? done / eligible : 0
      if (!future && eligible > 0) { perfectable++; if (r === 1) perfect++ }

      days.push({
        day: d,
        date: ds,
        future,
        today: ds === today,
        selected: ds === selDate,
        full: r === 1 && eligible > 0,
        ratio: r,
        eligible,
        done,
        title: `${ds} · ${done}/${eligible} done`,
      })
    }

    return { days, perfect, perfectable }
  }, [viewYear, viewMonth, today, selDate, habits])

  function prevMonth() {
    setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11 }; return m - 1 })
  }

  function nextMonth() {
    setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0 }; return m + 1 })
  }

  function goToday() {
    const p = parseDate(today)
    setViewYear(p.getFullYear())
    setViewMonth(p.getMonth())
    onSelectDate(today)
  }

  function handleDayClick(day) {
    if (day.future || day.blank) return
    onSelectDate(day.date)
  }

  return (
    <section className="card" style={{ animationDelay: '0.05s' }}>
      <div className="cal-head">
        <button className="navbtn" onClick={prevMonth} title="Previous month">‹</button>
        <div className="mname">{monthName} {viewYear}</div>
        <button className="navbtn" onClick={nextMonth} title="Next month">›</button>
      </div>
      <div className="dow-row">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
      </div>
      <div className="cal-grid">
        {calendar.days.map((day, i) =>
          day.blank ? (
            <div key={i} className="day blank" />
          ) : (
            <div
              key={day.date}
              className={[
                'day',
                day.future ? 'future' : '',
                day.today ? 'today' : '',
                day.selected ? 'sel' : '',
                day.full ? 'full' : '',
              ].filter(Boolean).join(' ')}
              data-date={day.date}
              title={day.title}
              style={
                !day.future && day.ratio > 0
                  ? day.ratio === 1
                    ? { background: '#1f8a5b' }
                    : { background: `rgba(31,138,91,${(0.10 + day.ratio * 0.65).toFixed(2)})` }
                  : undefined
              }
              onClick={() => handleDayClick(day)}
            >
              {day.day}
            </div>
          )
        )}
      </div>
      <div className="legend">
        <span>none</span>
        <div className="grad" />
        <span>all ✓</span>
      </div>
      <div className="cal-foot">
        <span className="perf">
          {calendar.perfectable > 0 ? `★ ${calendar.perfect} perfect day${calendar.perfect === 1 ? '' : 's'} this month` : ''}
        </span>
        <button className="linkbtn" onClick={goToday}>↺ back to today</button>
      </div>
    </section>
  )
}
