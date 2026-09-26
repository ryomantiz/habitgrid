/*******************************************************************
 * HABITGRID API · Cloudflare Worker + D1
 * ─────────────────────────────────────────────────────────────────
 * Requires:
 *   · D1 binding named  DB              (Settings ▸ Bindings)
 *   · Optional variable ALLOWED_ORIGIN  (Settings ▸ Variables)
 *     e.g. "https://YOUR-USERNAME.github.io"  or  "*" for testing
 *******************************************************************/

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: cors(request, env) });

    if (!url.pathname.startsWith('/api/'))
      return new Response('HabitGrid API is running ✔', { headers: cors(request, env) });

    try {
      if (url.pathname === '/api/ping')
        return json({ ok: true, time: new Date().toISOString() }, request, env);
      const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
      const result = await route(url.pathname, request, env, body);
      return json(result, request, env);
    } catch (e) {
      return json({ error: e.message || 'Server error' }, request, env, e.status || 400);
    }
  }
};

/* ─────────────────────────── router ─────────────────────────── */

async function route(path, req, env, b) {
  switch (path) {
    case '/api/signup':            return signup(env, req, b);
    case '/api/login':             return login(env, req, b);
    case '/api/logout': {          const t = bearer(req); await deleteSession(env, t); return { ok: true }; }
    case '/api/bootstrap': {       const u = await auth(env, req); return bootstrap(env, req, u); }
    case '/api/habit/add': {       const u = await auth(env, req); return addHabit(env, req, u, b); }
    case '/api/habit/toggle': {    const u = await auth(env, req); return toggleDone(env, req, u, b); }
    case '/api/habit/note': {      const u = await auth(env, req); return saveNote(env, req, u, b); }
    case '/api/habit/extend': {    const u = await auth(env, req); return extendHabit(env, req, u, b); }
    case '/api/habit/delete': {    const u = await auth(env, req); return deleteHabit(env, req, u, b); }
    case '/api/habit/rename': {    const u = await auth(env, req); return renameHabit(env, req, u, b); }
    case '/api/profile/update': {  const u = await auth(env, req); return updateProfile(env, u, b); }
    case '/api/profile/password': {const u = await auth(env, req); return changePassword(env, u, b); }
    // Notes
    case '/api/notes/bootstrap': {const u = await auth(env, req); return bootstrapNotes(env, u); }
    case '/api/note/create':     {const u = await auth(env, req); return createNote(env, u, b); }
    case '/api/note/update':     {const u = await auth(env, req); return updateNote(env, u, b); }
    case '/api/note/delete':     {const u = await auth(env, req); return deleteNote(env, u, b); }
    case '/api/note/tag':        {const u = await auth(env, req); return tagNote(env, u, b); }
    case '/api/tag/create':      {const u = await auth(env, req); return createTag(env, u, b); }
    // Folders
    case '/api/folder/create':   {const u = await auth(env, req); return createFolder(env, u, b); }
    case '/api/folder/rename':   {const u = await auth(env, req); return renameFolder(env, u, b); }
    case '/api/folder/delete':   {const u = await auth(env, req); return deleteFolder(env, u, b); }
    default: throw new HttpError('Endpoint not found', 404);
  }
}

/* ─────────────────────────── auth ─────────────────────────── */

async function signup(env, req, b) {
  const username = String(b.username || '').trim().toLowerCase();
  const displayName = String(b.displayName || '').trim().slice(0, 30) || username;
  const pic = validPic(b.pic);
  const password = String(b.password || '');
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) throw new HttpError('Username: 3–20 chars — letters, numbers, _ or . only');
  if (password.length < 4) throw new HttpError('Password needs at least 4 characters');

  const dup = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (dup) throw new HttpError('That username is taken');

  const salt = crypto.randomUUID();
  const id = 'u_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const passHash = await hashPassword(password, salt);
  await env.DB.prepare('INSERT INTO users (id, username, display_name, pic, pass_hash, salt) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, username, displayName, pic, passHash, salt).run();

  await purgeSessions(env);
  const token = await createSession(env, id);
  return { token, user: pub({ id, username, display_name: displayName, pic }), today: todayStr(req), habits: [], logs: {} };
}

async function login(env, req, b) {
  const username = String(b.username || '').trim().toLowerCase();
  const u = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!u) throw new HttpError('Unknown username');
  const hash = await hashPassword(String(b.password || ''), u.salt);
  if (hash !== u.pass_hash) throw new HttpError('Wrong password');

  await env.DB.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(u.id).run();
  await purgeSessions(env);
  const token = await createSession(env, u.id);
  const data = await bootstrap(env, req, u);
  return Object.assign({ token }, data, { user: pub(u) });
}

async function auth(env, req) {
  const token = bearer(req);
  if (!token) throw new HttpError('AUTH', 401);
  const s = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ? AND expires > datetime('now')")
    .bind(token).first();
  if (!s) throw new HttpError('AUTH', 401);
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(s.user_id).first();
  if (!u) throw new HttpError('AUTH', 401);
  return u;
}

const bearer = req => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

async function createSession(env, userId) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, datetime('now', '+30 days'))")
    .bind(token, userId).run();
  return token;
}

async function deleteSession(env, token) {
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

async function purgeSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires <= datetime('now')").run();
}

/* ──────────────────────── bootstrap ──────────────────────── */

async function bootstrap(env, req, u) {
  const today = todayStr(req);
  const hs = await env.DB.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC').bind(u.id).all();
  const rows = hs.results || [];
  const minStart = rows.length ? rows.map(h => h.start_date).sort()[0] : today;

  const ls = await env.DB.prepare('SELECT date, habit_id, done, note FROM logs WHERE user_id = ? AND date >= ?')
    .bind(u.id, minStart).all();
  const logsMap = {};
  (ls.results || []).forEach(l => {
    (logsMap[l.date] = logsMap[l.date] || {})[l.habit_id] = { done: !!l.done, note: l.note || '' };
  });

  return { user: pub(u), today, habits: rows.map(h => enrich(h, logsMap, today)), logs: logsMap };
}

function enrich(h, logsMap, today) {
  const isDone = ds => !!(logsMap[ds] && logsMap[ds][h.id] && logsMap[ds][h.id].done);
  let done = 0;
  for (const d in logsMap) if (isDone(d)) done++;

  let streak = 0;
  const parse = s => new Date(s + 'T00:00:00Z');
  const fmt = d => d.toISOString().slice(0, 10);
  let cur = parse(today);
  if (!isDone(today)) cur = new Date(cur.getTime() - 86400000); // today pending ≠ broken streak
  while (fmt(cur) >= h.start_date && isDone(fmt(cur))) { streak++; cur = new Date(cur.getTime() - 86400000); }

  const pct = Math.min(100, Math.round(done / h.target * 100));
  return {
    id: h.id, name: h.name, emoji: h.emoji, color: h.color, target: h.target,
    start: h.start_date, status: done >= h.target ? 'done' : 'active', done, streak, pct
  };
}

/* ──────────────────────── mutations ──────────────────────── */

async function addHabit(env, req, u, b) {
  const id = 'h_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14);
  await env.DB.prepare('INSERT INTO habits (id, user_id, name, emoji, color, target, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(
      id, u.id,
      String(b.name || 'New habit').trim().slice(0, 60),
      b.emoji || '🌱', b.color || '#1f8a5b',
      Math.max(1, Math.min(3650, parseInt(b.target, 10) || 100)),
      validDate(b.start) || todayStr(req)
    ).run();
  return bootstrap(env, req, u);
}

async function toggleDone(env, req, u, b) {
  if (!validDate(b.date)) throw new HttpError('Invalid date');
  if (b.date > todayStr(req)) return bootstrap(env, req, u);       // can't check the future
  await ownHabit(env, u.id, b.habitId);
  await env.DB.prepare(
    'INSERT INTO logs (date, habit_id, user_id, done, note) VALUES (?, ?, ?, ?, ?) ' +
    'ON CONFLICT(date, habit_id, user_id) DO UPDATE SET done = excluded.done'
  ).bind(b.date, b.habitId, u.id, b.done ? 1 : 0, '').run();
  return bootstrap(env, req, u);
}

async function saveNote(env, req, u, b) {
  if (!validDate(b.date)) throw new HttpError('Invalid date');
  if (b.date > todayStr(req)) return bootstrap(env, req, u);
  await ownHabit(env, u.id, b.habitId);
  await env.DB.prepare(
    'INSERT INTO logs (date, habit_id, user_id, done, note) VALUES (?, ?, ?, 0, ?) ' +
    'ON CONFLICT(date, habit_id, user_id) DO UPDATE SET note = excluded.note'
  ).bind(b.date, b.habitId, u.id, String(b.note || '').slice(0, 500)).run();
  return bootstrap(env, req, u);
}

async function extendHabit(env, req, u, b) {
  const h = await ownHabit(env, u.id, b.habitId);
  const add = Math.max(1, Math.min(3650, parseInt(b.days, 10) || 30));
  await env.DB.prepare("UPDATE habits SET target = ?, status = 'active' WHERE id = ?")
    .bind(Math.min(7300, h.target + add), b.habitId).run();
  return bootstrap(env, req, u);
}

async function deleteHabit(env, req, u, b) {
  await env.DB.prepare('DELETE FROM logs WHERE user_id = ? AND habit_id = ?').bind(u.id, b.habitId).run();
  await env.DB.prepare('DELETE FROM habits WHERE user_id = ? AND id = ?').bind(u.id, b.habitId).run();
  return bootstrap(env, req, u);
}

async function renameHabit(env, req, u, b) {
  await ownHabit(env, u.id, b.habitId);
  const name = String(b.name || '').trim().slice(0, 60);
  if (!name) throw new HttpError('Name cannot be empty');
  await env.DB.prepare('UPDATE habits SET name = ? WHERE id = ? AND user_id = ?').bind(name, b.habitId, u.id).run();
  return bootstrap(env, req, u);
}

async function updateProfile(env, u, b) {
  const name = String(b.displayName || '').trim().slice(0, 30) || u.username;
  const pic = validPic(b.pic);
  await env.DB.prepare('UPDATE users SET display_name = ?, pic = ? WHERE id = ?').bind(name, pic, u.id).run();
  return { user: { id: u.id, username: u.username, name, pic } };
}

async function changePassword(env, u, b) {
  const curHash = await hashPassword(String(b.currentPass || ''), u.salt);
  if (curHash !== u.pass_hash) throw new HttpError('Current password is wrong');
  if (String(b.newPass || '').length < 4) throw new HttpError('New password needs at least 4 characters');
  const salt = crypto.randomUUID();
  const passHash = await hashPassword(String(b.newPass), salt);
  await env.DB.prepare('UPDATE users SET salt = ?, pass_hash = ? WHERE id = ?').bind(salt, passHash, u.id).run();
  return { ok: true };
}

async function ownHabit(env, userId, habitId) {
  const h = await env.DB.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').bind(habitId, userId).first();
  if (!h) throw new HttpError('Habit not found in your account');
  return h;
}

/* ──────────────────────── notes ──────────────────────── */

function genId(prefix) {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14);
}

async function bootstrapNotes(env, u) {
  const folders = await env.DB.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name ASC').bind(u.id).all();
  const notes = await env.DB.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC').bind(u.id).all();
  const tags = await env.DB.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC').bind(u.id).all();
  const noteTags = await env.DB.prepare(
    'SELECT nt.note_id, nt.tag_id FROM note_tags nt JOIN tags t ON nt.tag_id = t.id WHERE t.user_id = ?'
  ).bind(u.id).all();

  const noteTagsMap = {};
  (noteTags.results || []).forEach(nt => {
    if (!noteTagsMap[nt.note_id]) noteTagsMap[nt.note_id] = [];
    noteTagsMap[nt.note_id].push(nt.tag_id);
  });

  return {
    folders: folders.results || [],
    notes: (notes.results || []).map(n => ({ ...n, tagIds: noteTagsMap[n.id] || [] })),
    tags: tags.results || [],
  };
}

async function createNote(env, u, b) {
  const id = genId('n');
  const title = String(b.title || 'Untitled').trim().slice(0, 200);
  const folderId = b.folderId || null;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await env.DB.prepare('INSERT INTO notes (id, user_id, title, content, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, u.id, title, '', folderId, now, now).run();
  return { id, title, content: '', folder_id: folderId, created_at: now, updated_at: now, tagIds: [] };
}

async function updateNote(env, u, b) {
  if (!b.noteId) throw new HttpError('noteId required');
  const n = await env.DB.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').bind(b.noteId, u.id).first();
  if (!n) throw new HttpError('Note not found');
  const title = b.title !== undefined ? String(b.title).trim().slice(0, 200) : undefined;
  const content = b.content !== undefined ? String(b.content).slice(0, 50000) : undefined;
  if (title !== undefined && content !== undefined) {
    await env.DB.prepare("UPDATE notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?").bind(title, content, b.noteId).run();
  } else if (title !== undefined) {
    await env.DB.prepare("UPDATE notes SET title = ?, updated_at = datetime('now') WHERE id = ?").bind(title, b.noteId).run();
  } else if (content !== undefined) {
    await env.DB.prepare("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?").bind(content, b.noteId).run();
  }
  return { ok: true };
}

async function deleteNote(env, u, b) {
  if (!b.noteId) throw new HttpError('noteId required');
  const n = await env.DB.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').bind(b.noteId, u.id).first();
  if (!n) throw new HttpError('Note not found');
  await env.DB.prepare('DELETE FROM note_tags WHERE note_id = ?').bind(b.noteId).run();
  await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(b.noteId).run();
  return { ok: true };
}

async function createFolder(env, u, b) {
  const id = genId('f');
  const name = String(b.name || 'New Folder').trim().slice(0, 100);
  const parentId = b.parentId || null;
  await env.DB.prepare('INSERT INTO folders (id, user_id, name, parent_id) VALUES (?, ?, ?, ?)').bind(id, u.id, name, parentId).run();
  return { id, name, parentId };
}

async function renameFolder(env, u, b) {
  if (!b.folderId) throw new HttpError('folderId required');
  const name = String(b.name || '').trim().slice(0, 100);
  if (!name) throw new HttpError('Folder name required');
  const f = await env.DB.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').bind(b.folderId, u.id).first();
  if (!f) throw new HttpError('Folder not found');
  await env.DB.prepare('UPDATE folders SET name = ? WHERE id = ?').bind(name, b.folderId).run();
  return { ok: true };
}

async function deleteFolder(env, u, b) {
  if (!b.folderId) throw new HttpError('folderId required');
  const f = await env.DB.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').bind(b.folderId, u.id).first();
  if (!f) throw new HttpError('Folder not found');
  await env.DB.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ?').bind(b.folderId).run();
  await env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(b.folderId).run();
  return { ok: true };
}

async function tagNote(env, u, b) {
  if (!b.noteId || !b.tagId) throw new HttpError('noteId and tagId required');
  const n = await env.DB.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').bind(b.noteId, u.id).first();
  if (!n) throw new HttpError('Note not found');
  if (b.action === 'add') {
    await env.DB.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').bind(b.noteId, b.tagId).run();
  } else if (b.action === 'remove') {
    await env.DB.prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?').bind(b.noteId, b.tagId).run();
  }
  return { ok: true };
}

async function createTag(env, u, b) {
  const id = genId('t');
  const name = String(b.name || '').trim().slice(0, 50);
  if (!name) throw new HttpError('Tag name required');
  await env.DB.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').bind(id, u.id, name).run();
  return { id, name };
}

/* ──────────────────────── utilities ──────────────────────── */

class HttpError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

const pub = u => ({ id: u.id, username: u.username, name: u.display_name, pic: u.pic || '' });

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + '::' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function validPic(url) {
  url = String(url || '').trim();
  if (!url) return '';
  if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|webm)(\?.*)?$/i.test(url))
    throw new HttpError('Picture must be a direct link ending in jpg, jpeg, png, gif, webp or webm.');
  return url.slice(0, 500);
}

const validDate = s => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null);

/* User's local "today", derived from their IP timezone */
function todayStr(req) {
  const tz = (req.cf && req.cf.timezone) || 'UTC';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function cors(req, env) {
  const origin = req.headers.get('Origin') || '*';
  const allow = env.ALLOWED_ORIGIN;
  const ok = !allow || allow === '*' || allow.split(',').map(s => s.trim()).includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, request, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(request, env), 'Content-Type': 'application/json; charset=utf-8' }
  });
}