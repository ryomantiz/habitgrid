import { apiCall } from './client'

export async function bootstrapNotes(token) {
  const data = await apiCall('/api/notes/bootstrap', {}, token)
  return data
}

export async function createNote(token, title, folderId) {
  const data = await apiCall(
    '/api/note/create',
    { title, folderId },
    token
  )
  return data
}

export async function updateNote(token, noteId, title, content) {
  const data = await apiCall(
    '/api/note/update',
    { noteId, title, content },
    token
  )
  return data
}

export async function deleteNote(token, noteId) {
  const data = await apiCall(
    '/api/note/delete',
    { noteId },
    token
  )
  return data
}

export async function createFolder(token, name, parentId) {
  const data = await apiCall(
    '/api/folder/create',
    { name, parentId },
    token
  )
  return data
}

export async function renameFolder(token, folderId, name) {
  const data = await apiCall(
    '/api/folder/rename',
    { folderId, name },
    token
  )
  return data
}

export async function deleteFolder(token, folderId) {
  const data = await apiCall(
    '/api/folder/delete',
    { folderId },
    token
  )
  return data
}

export async function addTag(token, noteId, tagId) {
  const data = await apiCall(
    '/api/note/tag',
    { noteId, tagId, action: 'add' },
    token
  )
  return data
}

export async function removeTag(token, noteId, tagId) {
  const data = await apiCall(
    '/api/note/tag',
    { noteId, tagId, action: 'remove' },
    token
  )
  return data
}

export async function createTag(token, name) {
  const data = await apiCall(
    '/api/tag/create',
    { name },
    token
  )
  return data
}
