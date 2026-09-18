export function cors(req, env) {
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

export function bearer(req) {
  return (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
}