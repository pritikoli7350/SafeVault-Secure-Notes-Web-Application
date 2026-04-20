const express = require("express");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/authMiddleware");
const {
  encrypt,
  decrypt,
  encryptCaesar,
  decryptCaesar
} = require("../utils/encryption");

const router = express.Router();
const multer = require("multer");
const fs = require("fs");


// ensure uploads folder exists
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* ================= ADD NOTE ================= */
router.post("/", authMiddleware, (req, res) => {
  upload.single("file")(req, res, async function (err) {
  

    if (err) {
      console.log("MULTER ERROR:", err);
      return res.status(500).json({ message: "File upload error" });
    }

    try {

      const { title, content, encryptionType, category } = req.body;

      if (!title || !content || !encryptionType || !category) {
        return res.status(400).json({ message: "All fields required" });
      }

      let encryptedContent;

      if (encryptionType === "AES") {
        encryptedContent = encrypt(content);
      } else if (encryptionType === "CAESAR") {
        encryptedContent = encryptCaesar(content);
      } else {
        return res.status(400).json({ message: "Invalid encryption type" });
      }

      const newNote = new Note({
        userId: req.user.userId,
        title,
        content: encryptedContent,
        encryptionType,
        category,
        file: req.file ? req.file.filename : null,
        originalFileName: req.file ? req.file.originalname : null
      });

      await newNote.save();

      console.log("Note saved successfully");

      // 💥 FINAL FIX: REDIRECT FROM BACKEND
      return res.status(201).json({ message: "Note saved successfully" });

    } catch (err) {
      console.log("SAVE ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }

  });

});

/* ================= GET USER NOTES ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {

    const notes = await Note.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    const decryptedNotes = notes.map(note => {

      let decryptedContent;

      try {
        if (note.encryptionType === "AES") {
          decryptedContent = decrypt(note.content);
        }
        else if (note.encryptionType === "CAESAR") {
          decryptedContent = decryptCaesar(note.content);
        }
        else {
          decryptedContent = note.content;
        }
      } catch (err) {
        decryptedContent = note.content;
      }

      return {
        ...note._doc,
        content: decryptedContent
      };

    });

    res.json(decryptedNotes);

  } catch (err) {
    console.log("FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE NOTE ================= */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE NOTE ================= */
router.put("/:id", authMiddleware, async (req, res) => {
  try {

    const { title, content } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    let encryptedContent;

    if (note.encryptionType === "AES") {
      encryptedContent = encrypt(content);
    }
    else if (note.encryptionType === "CAESAR") {
      encryptedContent = encryptCaesar(content);
    }
    else {
      encryptedContent = content;
    }

    note.title = title;
    note.content = encryptedContent;

    await note.save();

    res.json({ message: "Note updated successfully" });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;