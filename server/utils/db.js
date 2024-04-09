const mongoose = require("mongoose");

const url = "mongodb://localhost:27017/pukesmas"; // Ganti dengan URL MongoDB lokal Anda

(async () => {
  try {
    const db = await mongoose.connect(url);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("Couldn't connect to MongoDB", e);
  }
})();
