import { useState } from 'react'

export default function NoteList({ notes, folders, selectedFolder, selectedNote, onSelectNote, onCreateNote, onDeleteNote, toast }) {
  const [search, setSearch] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const filtered = notes.filter(n => {
    if (selectedFolder && n.folder_id !== selectedFolder) return false
    if (search) {
      const q = search.toLowerCase()
      return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    }
    return true
  })

  async function handleNewNote() {
    try {
      const note = await onCreateNote('Untitled', selectedFolder)
      toast('Note created 📝')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  async function handleDelete(noteId) {
    if (confirmDel !== noteId) {
      setConfirmDel(noteId)
      setTimeout(() => setConfirmDel(null), 2600)
      return
    }
    try {
      await onDeleteNote(noteId)
      toast('Note deleted')
      setConfirmDel(null)
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  return (
    <div className="note-list">
      <div className="note-list-header">
        <input
          type="text"
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="note-search"
        />
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={handleNewNote}>
          ＋ New
        </button>
      </div>

      <div className="note-list-items">
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: '30px 10px' }}>
            <p style={{ fontSize: 13 }}>{search ? 'No matching notes' : 'No notes yet'}</p>
          </div>
        ) : (
          filtered.map(note => (
            <div
              key={note.id}
              className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
              onClick={() => onSelectNote(note)}
            >
              <div className="note-list-item-title">{note.title || 'Untitled'}</div>
              <div className="note-list-item-preview">
                {(note.content || '').replace(/[#*_`~\[\]]/g, '').slice(0, 60) || 'Empty note'}
              </div>
              <div className="note-list-item-meta">
                <span>{(() => {
                  const raw = note.updated_at || note.created_at
                  if (!raw) return ''
                  try {
                    const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z')
                    return isNaN(d.getTime()) ? '' : d.toLocaleDateString()
                  } catch { return '' }
                })()}</span>
                {note.tagIds?.length > 0 && <span className="note-tag-count">{note.tagIds.length} tag{note.tagIds.length === 1 ? '' : 's'}</span>}
                <button
                  className={`note-del-btn ${confirmDel === note.id ? 'confirm' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                >
                  {confirmDel === note.id ? 'Sure?' : '🗑'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
