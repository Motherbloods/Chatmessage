const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

// const user1 = new User({
//   email: "dssdfdsfsdfafa@gmail.com",
//   fullName: "ddsfasdf",
//   password: "dfasdfa",
// });

// user1
//   .save()
//   .then((user) => {
//     console.log("User saved successfully:", user);
//   })
//   .catch((err) => {
//     console.error("Error saving user:", err.message);
//   });
module.exports = User;
