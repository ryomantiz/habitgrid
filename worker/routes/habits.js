import { HttpError } from '../utils/validators.js';
import { generateId, todayStr } from '../utils/db.js';
import { bootstrap } from './auth.js';

export async function addHabit(env, req, u, b) {
  const id = generateId('h');
  await env.DB.prepare(
    'INSERT INTO habits (id, user_id, name, emoji, color, target, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, u.id,
    String(b.name || 'New habit').trim().slice(0, 60),
    b.emoji || '🌱', b.color || '#1f8a5b',
    Math.max(1, Math.min(3650, parseInt(b.target, 10) || 100)),
    validDate(b.start) || todayStr(req)
  ).run();
  return bootstrap(env, req, u);
}

export async function toggleDone(env, req, u, b) {
  if (!validDate(b.date)) throw new HttpError('Invalid date');
  if (b.date > todayStr(req)) return bootstrap(env, req, u);
  await ownHabit(env, u.id, b.habitId);
  await env.DB.prepare(
    'INSERT INTO logs (date, habit_id, user_id, done, note) VALUES (?, ?, ?, ?, ?) ' +
    'ON CONFLICT(date, habit_id, user_id) DO UPDATE SET done = excluded.done'
  ).bind(b.date, b.habitId, u.id, b.done ? 1 : 0, '').run();
  return bootstrap(env, req, u);
}

export async function saveNote(env, req, u, b) {
  if (!validDate(b.date)) throw new HttpError('Invalid date');
  if (b.date > todayStr(req)) return bootstrap(env, req, u);
  await ownHabit(env, u.id, b.habitId);
  await env.DB.prepare(
    'INSERT INTO logs (date, habit_id, user_id, done, note) VALUES (?, ?, ?, 0, ?) ' +
    'ON CONFLICT(date, habit_id, user_id) DO UPDATE SET note = excluded.note'
  ).bind(b.date, b.habitId, u.id, String(b.note || '').slice(0, 500)).run();
  return bootstrap(env, req, u);
}

export async function extendHabit(env, req, u, b) {
  const h = await ownHabit(env, u.id, b.habitId);
  const add = Math.max(1, Math.min(3650, parseInt(b.days, 10) || 30));
  await env.DB.prepare("UPDATE habits SET target = ?, status = 'active' WHERE id = ?")
    .bind(Math.min(7300, h.target + add), b.habitId).run();
  return bootstrap(env, req, u);
}

export async function deleteHabit(env, req, u, b) {
  await env.DB.prepare('DELETE FROM logs WHERE user_id = ? AND habit_id = ?').bind(u.id, b.habitId).run();
  await env.DB.prepare('DELETE FROM habits WHERE user_id = ? AND id = ?').bind(u.id, b.habitId).run();
  return bootstrap(env, req, u);
}

async function ownHabit(env, userId, habitId) {
  const h = await env.DB.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').bind(habitId, userId).first();
  if (!h) throw new HttpError('Habit not found in your account');
  return h;
}

function validDate(s) {
  return (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null);
}