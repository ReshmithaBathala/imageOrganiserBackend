require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const db = require("./database");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Configure Multer (File Upload)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
// const upload = multer({ storage: multer.memoryStorage() });

app.post("/generate-tags", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const tags = ["example-tag-1", "example-tag-2"]; // Replace with AI processing
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: "Error generating AI tags" });
  }
});
// API to Upload Image
// app.post("/upload", upload.single("image"), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   const { filename, path: filePath } = req.file;

//   db.run(
//     "INSERT INTO images (filename, path) VALUES (?, ?)",
//     [filename, filePath],
//     function (err) {
//       if (err) return res.status(500).json({ error: err.message });

//       res.json({ id: this.lastID, filename, path: filePath });
//     }
//   );
// });

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { filename } = req.file;
  const filePath = `uploads/${filename}`; // Ensure correct relative path
  const tags = req.body.tags || "[]"; // AI-generated tags from frontend

  // db.run(
  //   "INSERT INTO images (filename, path, tags) VALUES (?, ?, ?)",
  //   [filename, filePath, tags],
  //   function (err) {
  //     if (err) return res.status(500).json({ error: err.message });

  //     res.json({
  //       id: this.lastID,
  //       filename,
  //       path: `/${filePath.replace(/\\/g, "/")}`, // Ensure forward slashes for compatibility
  //       tags: JSON.parse(tags),
  //     });
  //   }
  // );
  db.run(
    "INSERT INTO images (filename, path, tags) VALUES (?, ?, ?)",
    [filename, filePath, tags],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        filename,
        path: `/${filePath.replace(/\\/g, "/")}`, // Ensure correct accessible URL
        tags: JSON.parse(tags),
      });
    }
  );
});

// app.post("/upload", upload.single("image"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   const { filename } = req.file;
//   const filePath = path.join("uploads", filename);

//   const tags = req.body.tags || "[]"; // AI-generated tags from frontend

//   db.run(
//     "INSERT INTO images (filename, path, tags) VALUES (?, ?, ?)",
//     [filename, filePath, tags],
//     function (err) {
//       if (err) return res.status(500).json({ error: err.message });

//       res.json({
//         id: this.lastID,
//         filename,
//         path: `/${filePath.replace(/\\/g, "/")}`,
//         tags: JSON.parse(tags),
//       });
//     }
//   );
// });

// API to Get All Images
// app.get("/images", (req, res) => {
//   db.all("SELECT * FROM images", [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });

//     res.json(rows);
//   });
// });
// app.get("/images", (req, res) => {
//   const searchQuery = req.query.search || "";

//   db.all("SELECT * FROM images", [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });

//     const filteredImages = rows.filter((img) => {
//       const tags = JSON.parse(img.tags || "[]"); // Ensure tags are an array
//       return tags.some((tag) =>
//         tag.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     });

//     res.json(filteredImages);
//   });
// });
app.get("/images", (req, res) => {
  const searchQuery = req.query.search?.toLowerCase() || "";

  db.all("SELECT * FROM images", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!searchQuery) {
      return res.json(rows);
    }

    const filteredImages = rows.filter((img) => {
      try {
        const tags = JSON.parse(img.tags || "[]");
        return tags.some((tag) => tag.toLowerCase().includes(searchQuery));
      } catch (error) {
        console.error("Error parsing tags:", error);
        return false;
      }
    });

    res.json(filteredImages);
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const express = require("express");
// const sqlite3 = require("sqlite3").verbose();
// const multer = require("multer");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const PORT = 5001;
// const UPLOADS_DIR = path.join(__dirname, "uploads");

// // Ensure uploads directory exists
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR);
// }

// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static(UPLOADS_DIR));

// // ✅ SQLite Database (images.db)
// const db = new sqlite3.Database("./images.db", (err) => {
//   if (err) console.error("Database connection error:", err);
//   else {
//     db.run(
//       `CREATE TABLE IF NOT EXISTS images (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 filename TEXT,
//                 path TEXT,
//                 tags TEXT
//             )`
//     );
//   }
// });

// // ✅ Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOADS_DIR);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// // ✅ Mock AI Tag Generator
// const generateTags = (filename) => {
//   const keywords = [
//     "nature",
//     "city",
//     "portrait",
//     "sunset",
//     "food",
//     "technology",
//   ];
//   return [keywords[Math.floor(Math.random() * keywords.length)]];
// };

// // ✅ Upload Route (Generates AI Tags & Saves Image to DB)
// app.post("/upload", upload.single("image"), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   const filename = req.file.filename;
//   const filePath = `/uploads/${filename}`;
//   const tags = generateTags(filename); // Generate AI tags

//   db.run(
//     "INSERT INTO images (filename, path, tags) VALUES (?, ?, ?)",
//     [filename, filePath, JSON.stringify(tags)],
//     function (err) {
//       if (err) {
//         console.error("DB Insert Error:", err);
//         return res.status(500).json({ error: "Database error" });
//       }
//       res.json({ id: this.lastID, filename, path: filePath, tags });
//     }
//   );
// });

// // ✅ Fetch all images
// app.get("/images", (req, res) => {
//   db.all("SELECT * FROM images", [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// });

// app.listen(PORT, () =>
//   console.log(`Server running on http://localhost:${PORT}`)
// );
