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

function validDate(s) {
  return (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null);
}