import { bootstrap } from './auth.js';
import { generateId } from '../utils/db.js';

export async function bootstrapNotes(env, u) {
  const folders = await env.DB.prepare(
    'SELECT * FROM folders WHERE user_id = ? ORDER BY name ASC'
  ).bind(u.id).all();

  const notes = await env.DB.prepare(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(u.id).all();

  const tags = await env.DB.prepare(
    'SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC'
  ).bind(u.id).all();

  const noteTags = await env.DB.prepare(
    'SELECT nt.note_id, nt.tag_id FROM note_tags nt ' +
    'JOIN tags t ON nt.tag_id = t.id WHERE t.user_id = ?'
  ).bind(u.id).all();

  const noteTagsMap = {};
  (noteTags.results || []).forEach(nt => {
    if (!noteTagsMap[nt.note_id]) noteTagsMap[nt.note_id] = [];
    noteTagsMap[nt.note_id].push(nt.tag_id);
  });

  return {
    folders: folders.results || [],
    notes: (notes.results || []).map(n => ({
      ...n,
      tagIds: noteTagsMap[n.id] || [],
    })),
    tags: tags.results || [],
  };
}

export async function createNote(env, u, b) {
  const id = generateId('n');
  const title = String(b.title || 'Untitled').trim().slice(0, 200);
  const folderId = b.folderId || null;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await env.DB.prepare(
    'INSERT INTO notes (id, user_id, title, content, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, u.id, title, '', folderId, now, now).run();

  return { id, title, content: '', folder_id: folderId, created_at: now, updated_at: now, tagIds: [] };
}

export async function updateNote(env, u, b) {
  if (!b.noteId) throw new Error('noteId required');
  await ownNote(env, u.id, b.noteId);

  const title = b.title !== undefined ? String(b.title).trim().slice(0, 200) : undefined;
  const content = b.content !== undefined ? String(b.content).slice(0, 50000) : undefined;

  if (title !== undefined && content !== undefined) {
    await env.DB.prepare(
      "UPDATE notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(title, content, b.noteId).run();
  } else if (title !== undefined) {
    await env.DB.prepare(
      "UPDATE notes SET title = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(title, b.noteId).run();
  } else if (content !== undefined) {
    await env.DB.prepare(
      "UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(content, b.noteId).run();
  }

  return { ok: true };
}

export async function deleteNote(env, u, b) {
  if (!b.noteId) throw new Error('noteId required');
  await ownNote(env, u.id, b.noteId);
  await env.DB.prepare('DELETE FROM note_tags WHERE note_id = ?').bind(b.noteId).run();
  await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(b.noteId).run();
  return { ok: true };
}

export async function createFolder(env, u, b) {
  const id = generateId('f');
  const name = String(b.name || 'New Folder').trim().slice(0, 100);
  const parentId = b.parentId || null;

  await env.DB.prepare(
    'INSERT INTO folders (id, user_id, name, parent_id) VALUES (?, ?, ?, ?)'
  ).bind(id, u.id, name, parentId).run();

  return { id, name, parentId };
}

export async function renameFolder(env, u, b) {
  if (!b.folderId) throw new Error('folderId required');
  const name = String(b.name || '').trim().slice(0, 100);
  if (!name) throw new Error('Folder name required');
  await ownFolder(env, u.id, b.folderId);
  await env.DB.prepare('UPDATE folders SET name = ? WHERE id = ?').bind(name, b.folderId).run();
  return { ok: true };
}

export async function deleteFolder(env, u, b) {
  if (!b.folderId) throw new Error('folderId required');
  await ownFolder(env, u.id, b.folderId);
  await env.DB.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ?').bind(b.folderId).run();
  await env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(b.folderId).run();
  return { ok: true };
}

export async function tagNote(env, u, b) {
  if (!b.noteId || !b.tagId) throw new Error('noteId and tagId required');
  await ownNote(env, u.id, b.noteId);

  if (b.action === 'add') {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)'
    ).bind(b.noteId, b.tagId).run();
  } else if (b.action === 'remove') {
    await env.DB.prepare(
      'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?'
    ).bind(b.noteId, b.tagId).run();
  }
  return { ok: true };
}

export async function createTag(env, u, b) {
  const id = generateId('t');
  const name = String(b.name || '').trim().slice(0, 50);
  if (!name) throw new Error('Tag name required');
  await env.DB.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').bind(id, u.id, name).run();
  return { id, name };
}

async function ownNote(env, userId, noteId) {
  const n = await env.DB.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').bind(noteId, userId).first();
  if (!n) throw new Error('Note not found');
}

async function ownFolder(env, userId, folderId) {
  const f = await env.DB.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').bind(folderId, userId).first();
  if (!f) throw new Error('Folder not found');
}