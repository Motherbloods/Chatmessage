const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const {
  register,
  login,
  conversations,
  getConversations,
  messages,
  getMessages,
  getUsers,
  deleteMessage,
  createGroup,
  updateImg,
  addMemberOnGroup,
} = require("../controller/index.controller");

router.post("/api/register", upload.single("img"), register);
router.post("/api/login", login);
router.post("/api/conversations", conversations);
router.get("/api/conversations/:userId", getConversations);
router.post("/api/messages", messages);
router.post("/api/groups", createGroup);
router.get("/api/messages/:conversationId", getMessages);
router.get("/api/users/:userId", getUsers);
router.delete("/api/message/:messageId", deleteMessage);
router.patch("/api/imgUpdate/:id", upload.single("img"), updateImg);
router.patch("/api/membersUpdate/:id", addMemberOnGroup);

module.exports = router;
