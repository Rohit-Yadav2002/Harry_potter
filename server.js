require('dotenv').config();

const path = require('path');
const express = require('express');

const { initStorage } = require('./src/db');
const { requireAuth, isAuthed, handleUnlock, handleLock } = require('./src/auth');
const photosRouter = require('./src/routes/photos');
const songsRouter = require('./src/routes/songs');
const complaintsRouter = require('./src/routes/complaints');

const app = express();
const PORT = process.env.PORT || 3000;
const LOGIN_FILE = path.join(__dirname, 'public', 'login.html');

// Behind a proxy (Render etc.) so secure cookies are detected correctly
app.set('trust proxy', 1);

// Parse JSON bodies (small limit — these are short love-notes, not uploads)
app.use(express.json({ limit: '16kb' }));

// ── Password gate (the portrait hole) ──────────────────────
// These must be reachable while the site is still locked.
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.post('/api/unlock', handleUnlock);
app.post('/api/lock', handleLock);
app.get('/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/');
  res.sendFile(LOGIN_FILE);
});

// Everything below this line requires the password.
app.use(requireAuth);

// Serve the magical frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve the media you drop into media/photos and media/songs
app.use('/media', express.static(path.join(__dirname, 'media')));

// Feature APIs
app.use('/api/photos', photosRouter);
app.use('/api/songs', songsRouter);
app.use('/api/complaints', complaintsRouter);

initStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  ✨  The magic is alive at http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise storage:', err);
    process.exit(1);
  });
