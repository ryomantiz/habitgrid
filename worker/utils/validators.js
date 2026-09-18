export class HttpError extends Error {
  constructor(msg, status = 400) {
    super(msg);
    this.status = status;
  }
}

export function validPic(url) {
  url = String(url || '').trim();
  if (!url) return '';
  if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|webm)(\?.*)?$/i.test(url))
    throw new HttpError('Picture must be a direct link ending in jpg, jpeg, png, gif, webp or webm.');
  return url.slice(0, 500);
}

export function validDate(s) {
  return (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : null);
}

export function pub(u) {
  return { id: u.id, username: u.username, name: u.display_name, pic: u.pic || '' };
}