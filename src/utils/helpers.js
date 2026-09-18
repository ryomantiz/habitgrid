export function generateId(prefix) {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 14)
  return prefix + '_' + uuid
}
