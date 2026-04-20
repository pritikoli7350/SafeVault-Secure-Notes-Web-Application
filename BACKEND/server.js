const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");
const authMiddleware = require("./middleware/authMiddleware");
// ✅ CREATE APP FIRST
const app = express();
app.use("/uploads", express.static("uploads"));

// ✅ MIDDLEWARE AFTER APP
app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// Optional protected test route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    userId: req.user.id
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🎉");
});

// ✅ DATABASE CONNECTION AT END
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
app.get("/testdb", async (req, res) => {
  const users = await mongoose.connection.db.collection("users").find().toArray();
  res.json(users);
});
app.get("/dbinfo", (req, res) => {
  res.json({
    dbName: mongoose.connection.name,
    host: mongoose.connection.host
  });
});
