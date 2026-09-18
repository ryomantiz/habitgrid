import { useState } from 'react'

export default function FolderTree({ folders, selectedFolder, onSelectFolder, onCreateFolder, onRenameFolder, onDeleteFolder, toast }) {
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [creating, setCreating] = useState(false)

  const rootFolders = folders.filter(f => !f.parent_id)

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      toast('Folder name required')
      return
    }
    try {
      await onCreateFolder(newFolderName.trim(), null)
      setNewFolderName('')
      setCreating(false)
      toast('Folder created 📁')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  async function handleRename(folderId) {
    if (!renameValue.trim()) return
    try {
      await onRenameFolder(folderId, renameValue.trim())
      setRenamingId(null)
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  async function handleDeleteFolder(folderId) {
    if (!confirm('Delete this folder? Notes will be moved to root.')) return
    try {
      await onDeleteFolder(folderId)
      toast('Folder deleted')
    } catch (e) {
      toast('⚠️ ' + (e.message || 'Failed'))
    }
  }

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <span className="folder-tree-title">Folders</span>
        <button className="iconbtn" onClick={() => setCreating(!creating)} title="New folder" style={{ width: 24, height: 24, fontSize: 12 }}>＋</button>
      </div>

      {creating && (
        <div className="folder-input-row">
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setCreating(false) }}
            autoFocus
            style={{ fontSize: 12, padding: '5px 8px' }}
          />
        </div>
      )}

      <div
        className={`folder-item ${selectedFolder === null ? 'selected' : ''}`}
        onClick={() => onSelectFolder(null)}
      >
        📄 All Notes
      </div>

      {rootFolders.map(folder => (
        <div key={folder.id} className="folder-item-wrap">
          {renamingId === folder.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRename(folder.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(folder.id); if (e.key === 'Escape') setRenamingId(null) }}
              autoFocus
              style={{ fontSize: 12, padding: '4px 8px', width: '100%' }}
            />
          ) : (
            <div
              className={`folder-item ${selectedFolder === folder.id ? 'selected' : ''}`}
              onClick={() => onSelectFolder(folder.id)}
              onDoubleClick={() => { setRenamingId(folder.id); setRenameValue(folder.name) }}
            >
              📁 {folder.name}
              <button
                className="folder-delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }}
                title="Delete folder"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
