import { useState, useRef, useEffect, useCallback } from 'react'

export default function NoteEditor({ note, tags, onUpdateNote, onAddTag, onRemoveTag, onCreateTag, toast }) {
  const [title, setTitle] = useState(note.title || '')
  const [content, setContent] = useState(note.content || '')
  const [newTagName, setNewTagName] = useState('')
  const saveTimer = useRef(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTitle(note.title || '')
    setContent(note.content || '')
    setSaved(false)
  }, [note.id])

  const debouncedSave = useCallback((t, c) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(() => {
      onUpdateNote(note.id, t, c).then(() => {
        setSaved(true)
        setTimeout(() => setSaved(false), 1400)
      }).catch(() => {})
    }, 1000)
  }, [note.id, onUpdateNote])

  function handleTitleChange(e) {
    const v = e.target.value
    setTitle(v)
    debouncedSave(v, content)
  }

  function handleContentChange(e) {
    const v = e.target.value
    setContent(v)
    debouncedSave(title, v)
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return
    try {
      const tag = await onCreateTag(newTagName.trim())
      await onAddTag(note.id, tag.id)
      setNewTagName('')
      toast('Tag added')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  async function handleRemoveTag(tagId) {
    try {
      await onRemoveTag(note.id, tagId)
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  const noteTags = tags.filter(t => (note.tagIds || []).includes(t.id))

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-editor-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title…"
        />
        <span className={`note-save-status ${saved ? 'show' : ''}`}>
          {saved ? '✓ Saved' : 'Saving…'}
        </span>
      </div>

      <div className="note-tags-bar">
        {noteTags.map(t => (
          <span key={t.id} className="note-tag">
            {t.name}
            <button className="note-tag-remove" onClick={() => handleRemoveTag(t.id)}>✕</button>
          </span>
        ))}
        <input
          type="text"
          className="note-tag-input"
          placeholder="+ tag"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }}
        />
      </div>

      <textarea
        className="note-editor-content"
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing in Markdown…&#10;&#10;# Heading&#10;## Subheading&#10;&#10;**Bold** and *italic*&#10;&#10;- List item&#10;- Another item&#10;&#10;> Blockquote&#10;&#10;`inline code`&#10;&#10;```&#10;code block&#10;```"
        spellCheck="false"
      />

      <div className="note-editor-footer">
        <span>{content.split(/\s+/).filter(Boolean).length} words · {content.length} chars</span>
        <span>{new Date((note.updated_at || note.created_at || '').replace(' ', 'T') + 'Z').toLocaleString()}</span>
      </div>
    </div>
  )
}
