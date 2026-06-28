const express = require('express');
const path = require('path');
const { listMediaFiles } = require('../lib/mediaFolder');

const router = express.Router();

const SONGS_DIR = path.join(__dirname, '..', '..', 'media', 'songs');
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.m4a', '.ogg', '.oga', '.wav', '.aac', '.flac', '.opus', '.weba',
]);

// GET /api/songs -> [{ name, url }]  (the frontend picks a random one to play)
router.get('/', async (req, res) => {
  try {
    const songs = await listMediaFiles(SONGS_DIR, AUDIO_EXTENSIONS, '/media/songs');
    res.json(songs);
  } catch (err) {
    console.error('Error reading songs folder:', err);
    res.status(500).json({ error: 'Could not read songs' });
  }
});

module.exports = router;
