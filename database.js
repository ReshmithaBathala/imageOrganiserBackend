const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./images.db", (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    path TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT
  )
`);

module.exports = db;
