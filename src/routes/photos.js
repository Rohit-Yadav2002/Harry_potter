const express = require('express');
const path = require('path');
const { listMediaFiles } = require('../lib/mediaFolder');

const router = express.Router();

const PHOTOS_DIR = path.join(__dirname, '..', '..', 'media', 'photos');
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp',
]);

// GET /api/photos -> [{ name, url }]
router.get('/', async (req, res) => {
  try {
    const photos = await listMediaFiles(PHOTOS_DIR, IMAGE_EXTENSIONS, '/media/photos');
    res.json(photos);
  } catch (err) {
    console.error('Error reading photos folder:', err);
    res.status(500).json({ error: 'Could not read photos' });
  }
});

module.exports = router;
