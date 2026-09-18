export function generateId(prefix) {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 14);
  return prefix + '_' + uuid;
}

export function todayStr(req) {
  const tz = (req.cf && req.cf.timezone) || 'UTC';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}