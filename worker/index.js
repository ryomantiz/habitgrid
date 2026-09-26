import { cors, bearer } from './middleware/cors.js';
import { HttpError } from './utils/validators.js';
import { bootstrap as authBootstrap, signup, login, logout, createSession, deleteSession, purgeSessions } from './routes/auth.js';
import { addHabit, toggleDone, saveNote, extendHabit, deleteHabit, renameHabit } from './routes/habits.js';
import { bootstrapNotes, createNote, updateNote, deleteNote, createFolder, renameFolder, deleteFolder, tagNote, createTag } from './routes/notes.js';
import { updateProfile, changePassword } from './routes/profile.js';

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
      const status = e instanceof HttpError ? (e.status || 400) : 400;
      return json({ error: e.message || 'Server error' }, request, env, status);
    }
  }
};

async function route(path, req, env, b) {
  switch (path) {
    case '/api/signup': return signup(env, req, b);
    case '/api/login': return login(env, req, b);
    case '/api/logout': {
      const t = bearer(req);
      await deleteSession(env, t);
      return { ok: true };
    }
    case '/api/bootstrap': {
      const u = await auth(env, req);
      return authBootstrap(env, req, u);
    }
    case '/api/habit/add': {
      const u = await auth(env, req);
      return addHabit(env, req, u, b);
    }
    case '/api/habit/toggle': {
      const u = await auth(env, req);
      return toggleDone(env, req, u, b);
    }
    case '/api/habit/note': {
      const u = await auth(env, req);
      return saveNote(env, req, u, b);
    }
    case '/api/habit/extend': {
      const u = await auth(env, req);
      return extendHabit(env, req, u, b);
    }
    case '/api/habit/delete': {
      const u = await auth(env, req);
      return deleteHabit(env, req, u, b);
    }
    case '/api/habit/rename': {
      const u = await auth(env, req);
      return renameHabit(env, req, u, b);
    }
    case '/api/profile/update': {
      const u = await auth(env, req);
      return updateProfile(env, u, b);
    }
    case '/api/profile/password': {
      const u = await auth(env, req);
      return changePassword(env, u, b);
    }
    // Notes endpoints
    case '/api/notes/bootstrap': {
      const u = await auth(env, req);
      return bootstrapNotes(env, u);
    }
    case '/api/note/create': {
      const u = await auth(env, req);
      return createNote(env, u, b);
    }
    case '/api/note/update': {
      const u = await auth(env, req);
      return updateNote(env, u, b);
    }
    case '/api/note/delete': {
      const u = await auth(env, req);
      return deleteNote(env, u, b);
    }
    case '/api/folder/create': {
      const u = await auth(env, req);
      return createFolder(env, u, b);
    }
    case '/api/folder/rename': {
      const u = await auth(env, req);
      return renameFolder(env, u, b);
    }
    case '/api/folder/delete': {
      const u = await auth(env, req);
      return deleteFolder(env, u, b);
    }
    case '/api/note/tag': {
      const u = await auth(env, req);
      return tagNote(env, u, b);
    }
    case '/api/tag/create': {
      const u = await auth(env, req);
      return createTag(env, u, b);
    }
    default: throw new HttpError('Endpoint not found', 404);
  }
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

function json(data, request, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(request, env), 'Content-Type': 'application/json; charset=utf-8' }
  });
}