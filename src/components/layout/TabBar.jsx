export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === 'habits' ? 'active' : ''}`}
        onClick={() => onTabChange('habits')}
      >
        Habits
      </button>
      <button
        className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
        onClick={() => onTabChange('notes')}
      >
        Notes
      </button>
    </div>
  )
}
