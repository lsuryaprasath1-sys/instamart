const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads')
);

fs.mkdirSync(uploadsDir, { recursive: true });

module.exports = uploadsDir;
