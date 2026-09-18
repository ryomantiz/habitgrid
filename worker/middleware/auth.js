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