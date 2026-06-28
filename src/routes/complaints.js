const express = require('express');
const { getComplaints, addComplaint } = require('../db');

const router = express.Router();

const MAX_MESSAGE = 2000;
const MAX_FROM = 120;

// GET /api/complaints -> [{ from, message, createdAt }] (newest first)
router.get('/', async (req, res) => {
  try {
    const complaints = await getComplaints();
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Could not fetch complaints' });
  }
});

// POST /api/complaints { from, message }
router.post('/', async (req, res) => {
  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  let from = typeof body.from === 'string' ? body.from.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'A message is required' });
  }
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: 'Message is too long' });
  }
  if (!from) from = 'A mystery owl';
  if (from.length > MAX_FROM) from = from.slice(0, MAX_FROM);

  try {
    const complaint = await addComplaint({ from, message });
    res.status(201).json(complaint);
  } catch (err) {
    console.error('Error saving complaint:', err);
    res.status(500).json({ error: 'Could not save complaint' });
  }
});

module.exports = router;
