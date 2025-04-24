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

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { filename } = req.file;
  const filePath = `uploads/${filename}`; // Ensure correct relative path
  const tags = req.body.tags || "[]"; // AI-generated tags from frontend

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

// Add this to your server.js (before the app.listen)
app.get("/albums", (req, res) => {
  db.all("SELECT * FROM images", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Group images by their first tag
    const albums = {};
    rows.forEach((img) => {
      try {
        const tags = JSON.parse(img.tags || "[]");
        if (tags.length > 0) {
          const primaryTag = tags[0]; // Use first tag as album category
          if (!albums[primaryTag]) {
            albums[primaryTag] = {
              coverImage: img, // Use first image with this tag as cover
              images: [],
              tag: primaryTag,
            };
          }
          albums[primaryTag].images.push(img);
        }
      } catch (error) {
        console.error("Error parsing tags:", error);
      }
    });

    res.json(Object.values(albums));
  });
});

app.get("/albums/:tag", (req, res) => {
  const tag = req.params.tag;

  db.all(
    "SELECT * FROM images WHERE tags LIKE ?",
    [`%${tag}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json(rows);
    }
  );
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
