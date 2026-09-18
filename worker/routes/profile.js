import { validPic, pub } from '../utils/validators.js';
import { hashPassword } from '../utils/crypto.js';

export async function updateProfile(env, u, b) {
  const name = String(b.displayName || '').trim().slice(0, 30) || u.username;
  const pic = validPic(b.pic);
  await env.DB.prepare('UPDATE users SET display_name = ?, pic = ? WHERE id = ?').bind(name, pic, u.id).run();
  return { user: { id: u.id, username: u.username, name, pic } };
}

export async function changePassword(env, u, b) {
  const curHash = await hashPassword(String(b.currentPass || ''), u.salt);
  if (curHash !== u.pass_hash) throw new Error('Current password is wrong');
  if (String(b.newPass || '').length < 4) throw new Error('New password needs at least 4 characters');
  const salt = crypto.randomUUID();
  const passHash = await hashPassword(String(b.newPass), salt);
  await env.DB.prepare('UPDATE users SET salt = ?, pass_hash = ? WHERE id = ?').bind(salt, passHash, u.id).run();
  return { ok: true };
}