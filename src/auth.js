/**
 * A gentle password gate — the portrait hole to the common room.
 *
 * The password defaults to "polkadot" and can be overridden with the
 * SITE_PASSWORD environment variable on the live site. A signed cookie keeps
 * the visitor in; the real password is never sent to the browser.
 */
const crypto = require('crypto');

const SITE_PASSWORD =
  process.env.SITE_PASSWORD && process.env.SITE_PASSWORD.trim()
    ? process.env.SITE_PASSWORD.trim()
    : 'polkadot';

const AUTH_SECRET =
  process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim()
    ? process.env.AUTH_SECRET.trim()
    : crypto.createHash('sha256').update('hp-love::' + SITE_PASSWORD).digest('hex');

const COOKIE_NAME = 'hp_auth';
const AUTH_TOKEN = crypto.createHmac('sha256', AUTH_SECRET).update('authorized').digest('hex');
const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function isAuthed(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(AUTH_TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function checkPassword(input) {
  // Hash both sides to a fixed length so the compare is constant-time and safe.
  const provided = crypto.createHash('sha256').update(String(input)).digest();
  const expected = crypto.createHash('sha256').update(SITE_PASSWORD).digest();
  return crypto.timingSafeEqual(provided, expected);
}

function handleUnlock(req, res) {
  const password = req.body && req.body.password;
  if (typeof password !== 'string' || !checkPassword(password)) {
    return res.status(401).json({ error: 'That is not the password.' });
  }
  res.cookie(COOKIE_NAME, AUTH_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  res.json({ ok: true });
}

function handleLock(req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

// Blocks every request that doesn't carry a valid cookie.
function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'locked' });
  }
  return res.redirect('/login');
}

module.exports = { requireAuth, isAuthed, handleUnlock, handleLock };
