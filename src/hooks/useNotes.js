import { useState, useCallback, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
  bootstrapNotes as apiBootstrap,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  createFolder as apiCreateFolder,
  renameFolder as apiRenameFolder,
  deleteFolder as apiDeleteFolder,
  addTag as apiAddTag,
  removeTag as apiRemoveTag,
  createTag as apiCreateTag,
} from '../api/notes'

export default function useNotes() {
  const { token } = useContext(AuthContext)
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeNote, setActiveNote] = useState(null)

  const bootstrap = useCallback(async () => {
    if (!token) return null
    setLoading(true)
    try {
      const res = await apiBootstrap(token)
      setNotes(res.notes || [])
      setFolders(res.folders || [])
      setTags(res.tags || [])
      return res
    } catch (e) {
      throw e
    } finally {
      setLoading(false)
    }
  }, [token])

  const createNote = useCallback(async (title, folderId) => {
    const note = await apiCreateNote(token, title, folderId)
    setNotes(prev => [{ ...note, tagIds: [] }, ...prev])
    setActiveNote({ ...note, tagIds: [] })
    return note
  }, [token])

  const updateNote = useCallback(async (noteId, title, content) => {
    await apiUpdateNote(token, noteId, title, content)
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: title ?? n.title, content: content ?? n.content, updated_at: new Date().toISOString() } : n))
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, title: title ?? prev.title, content: content ?? prev.content } : prev)
    }
  }, [token, activeNote])

  const deleteNote = useCallback(async (noteId) => {
    await apiDeleteNote(token, noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
    if (activeNote?.id === noteId) setActiveNote(null)
  }, [token, activeNote])

  const createFolder = useCallback(async (name, parentId) => {
    const folder = await apiCreateFolder(token, name, parentId)
    setFolders(prev => [...prev, folder])
    return folder
  }, [token])

  const renameFolder = useCallback(async (folderId, name) => {
    await apiRenameFolder(token, folderId, name)
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f))
  }, [token])

  const deleteFolder = useCallback(async (folderId) => {
    await apiDeleteFolder(token, folderId)
    setFolders(prev => prev.filter(f => f.id !== folderId))
    setNotes(prev => prev.map(n => n.folder_id === folderId ? { ...n, folder_id: null } : n))
  }, [token])

  const addTagToNote = useCallback(async (noteId, tagId) => {
    await apiAddTag(token, noteId, tagId)
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, tagIds: [...(n.tagIds || []), tagId] } : n))
  }, [token])

  const removeTagFromNote = useCallback(async (noteId, tagId) => {
    await apiRemoveTag(token, noteId, tagId)
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, tagIds: (n.tagIds || []).filter(id => id !== tagId) } : n))
  }, [token])

  const createTag = useCallback(async (name) => {
    const tag = await apiCreateTag(token, name)
    setTags(prev => [...prev, tag])
    return tag
  }, [token])

  return {
    notes, folders, tags, loading, activeNote, setActiveNote,
    bootstrap, createNote, updateNote, deleteNote,
    createFolder, renameFolder, deleteFolder,
    addTagToNote, removeTagFromNote, createTag,
  }
}
