import { HttpError, pub, validPic } from '../utils/validators.js';
import { hashPassword } from '../utils/crypto.js';
import { generateId, todayStr } from '../utils/db.js';

export async function signup(env, req, b) {
  const username = String(b.username || '').trim().toLowerCase();
  const displayName = String(b.displayName || '').trim().slice(0, 30) || username;
  const pic = validPic(b.pic);
  const password = String(b.password || '');

  if (!/^[a-z0-9_.]{3,20}$/.test(username))
    throw new HttpError('Username: 3–20 chars — letters, numbers, _ or . only');
  if (password.length < 4)
    throw new HttpError('Password needs at least 4 characters');

  const dup = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (dup) throw new HttpError('That username is taken');

  const salt = crypto.randomUUID();
  const id = generateId('u');
  const passHash = await hashPassword(password, salt);

  await env.DB.prepare(
    'INSERT INTO users (id, username, display_name, pic, pass_hash, salt) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, username, displayName, pic, passHash, salt).run();

  await purgeSessions(env);
  const token = await createSession(env, id);
  return {
    token,
    user: pub({ id, username, display_name: displayName, pic }),
    today: todayStr(req),
    habits: [],
    logs: {},
  };
}

export async function login(env, req, b) {
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

export async function logout(env, token) {
  await deleteSession(env, token);
  return { ok: true };
}

export async function createSession(env, userId) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, datetime('now', '+30 days'))"
  ).bind(token, userId).run();
  return token;
}

export async function deleteSession(env, token) {
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function purgeSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires <= datetime('now')").run();
}

export async function bootstrap(env, req, u) {
  const today = todayStr(req);
  const hs = await env.DB.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC')
    .bind(u.id).all();
  const rows = hs.results || [];
  const minStart = rows.length ? rows.map(h => h.start_date).sort()[0] : today;

  const ls = await env.DB.prepare(
    'SELECT date, habit_id, done, note FROM logs WHERE user_id = ? AND date >= ?'
  ).bind(u.id, minStart).all();

  const logsMap = {};
  (ls.results || []).forEach(l => {
    (logsMap[l.date] = logsMap[l.date] || {})[l.habit_id] = { done: !!l.done, note: l.note || '' };
  });

  return {
    user: pub(u),
    today,
    habits: rows.map(h => enrich(h, logsMap, today)),
    logs: logsMap,
  };
}

function enrich(h, logsMap, today) {
  const isDone = ds => !!(logsMap[ds] && logsMap[ds][h.id] && logsMap[ds][h.id].done);
  let done = 0;
  for (const d in logsMap) if (isDone(d)) done++;

  let streak = 0;
  const parse = s => new Date(s + 'T00:00:00Z');
  const fmt = d => d.toISOString().slice(0, 10);
  let cur = parse(today);
  if (!isDone(today)) cur = new Date(cur.getTime() - 86400000);
  while (fmt(cur) >= h.start_date && isDone(fmt(cur))) {
    streak++;
    cur = new Date(cur.getTime() - 86400000);
  }

  const pct = Math.min(100, Math.round((done / h.target) * 100));
  return {
    id: h.id, name: h.name, emoji: h.emoji, color: h.color, target: h.target,
    start: h.start_date, status: done >= h.target ? 'done' : 'active', done, streak, pct,
  };
}