import { useState, useEffect, useRef } from 'react'
import FolderTree from './FolderTree'
import NoteList from './NoteList'
import NoteEditor from './NoteEditor'

export default function NotesView({ notes, toast }) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)

  useEffect(() => {
    if (notes.activeNote) {
      setSelectedNote(notes.activeNote)
    }
  }, [notes.activeNote])

  function handleNoteSelect(note) {
    setSelectedNote(note)
  }

  return (
    <div className="notes-layout">
      <div className="notes-sidebar">
        <FolderTree
          folders={notes.folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={notes.createFolder}
          onRenameFolder={notes.renameFolder}
          onDeleteFolder={notes.deleteFolder}
          toast={toast}
        />
        <NoteList
          notes={notes.notes}
          folders={notes.folders}
          selectedFolder={selectedFolder}
          selectedNote={selectedNote}
          onSelectNote={handleNoteSelect}
          onCreateNote={notes.createNote}
          onDeleteNote={notes.deleteNote}
          toast={toast}
        />
      </div>

      <div className="notes-editor-area">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            tags={notes.tags}
            onUpdateNote={notes.updateNote}
            onAddTag={notes.addTagToNote}
            onRemoveTag={notes.removeTagFromNote}
            onCreateTag={notes.createTag}
            toast={toast}
          />
        ) : (
          <div className="empty" style={{ padding: '60px 20px' }}>
            <div className="empty-ico">📝</div>
            <p><b>Select a note or create a new one.</b><br />Your notes are saved automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
