import { useState } from 'react'
import { todayStr } from '../../utils/dates'
import Calendar from './Calendar'
import CheckinPanel from './CheckinPanel'
import HabitBoard from './HabitBoard'
import AddHabitModal from './AddHabitModal'
import ExtendModal from './ExtendModal'

export default function HabitsView({ habits, toast }) {
  const [addOpen, setAddOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendId, setExtendId] = useState(null)
  const [selDate, setSelDate] = useState(habits.today || todayStr())

  const handleAdd = () => setAddOpen(true)
  const handleExtend = (id) => { setExtendId(id); setExtendOpen(true) }

  return (
    <main className="layout">
      <div className="col">
        <Calendar habits={habits} selDate={selDate} onSelectDate={setSelDate} />
      </div>

      <div className="col">
        <CheckinPanel habits={habits} selDate={selDate} toast={toast} />
        <HabitBoard habits={habits} toast={toast} onAdd={handleAdd} onExtend={handleExtend} />
      </div>

      <AddHabitModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        habits={habits}
        toast={toast}
      />

      <ExtendModal
        open={extendOpen}
        onClose={() => { setExtendOpen(false); setExtendId(null) }}
        habitId={extendId}
        habits={habits}
        toast={toast}
      />
    </main>
  )
}
