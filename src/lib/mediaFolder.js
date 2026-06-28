/**
 * Reads a media folder and returns a sorted list of playable/viewable files.
 * Only files with an allowed extension are returned; hidden/dot files and
 * sub-folders are ignored. Missing folder => empty list (not an error).
 */
const fs = require('fs/promises');
const path = require('path');

async function listMediaFiles(dir, allowedExtensions, urlPrefix) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      url: `${urlPrefix}/${encodeURIComponent(name)}`,
    }));
}

module.exports = { listMediaFiles };
