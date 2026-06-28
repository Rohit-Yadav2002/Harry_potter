/**
 * Complaints storage.
 *
 * If MONGODB_URI is set we use MongoDB (recommended for the live site so
 * nothing is ever lost). Otherwise we fall back to a local JSON file so the
 * site runs out-of-the-box for local testing.
 */
const fsp = require('fs/promises');
const path = require('path');

let mode = 'file';
let collection = null;
let mongoClient = null;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'complaints.json');

async function initStorage() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim()) {
    const { MongoClient } = require('mongodb');
    mongoClient = new MongoClient(uri.trim());
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGODB_DB || 'romantic_hp');
    collection = db.collection('complaints');
    await collection.createIndex({ createdAt: -1 });
    mode = 'mongo';
    console.log('  🗄️   Complaints stored in MongoDB');
    return;
  }

  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(DATA_FILE);
  } catch {
    await fsp.writeFile(DATA_FILE, '[]', 'utf8');
  }
  mode = 'file';
  console.log('  🗄️   Complaints stored in local file (set MONGODB_URI for the live site)');
}

async function getComplaints() {
  if (mode === 'mongo') {
    return collection
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  const raw = await fsp.readFile(DATA_FILE, 'utf8');
  const list = JSON.parse(raw || '[]');
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addComplaint({ from, message }) {
  const complaint = { from, message, createdAt: new Date().toISOString() };

  if (mode === 'mongo') {
    await collection.insertOne({ ...complaint });
    return complaint;
  }

  const raw = await fsp.readFile(DATA_FILE, 'utf8');
  const list = JSON.parse(raw || '[]');
  list.push(complaint);
  await fsp.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  return complaint;
}

module.exports = { initStorage, getComplaints, addComplaint };
