const mongoose = require("mongoose");

const password = encodeURIComponent("220103178Sukoharjo06");
const dbName = "chatMessage"; // Ganti dengan nama database Anda
const url = `mongodb+srv://motherbloodss:${password}@cluster0.ihtev7u.mongodb.net/${dbName}?retryWrites=true&w=majority`;

(async () => {
  try {
    const db = await mongoose.connect(url);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("Couldn't connect to MongoDB", e);
  }
})();
