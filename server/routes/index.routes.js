const express = require("express");
const router = express.Router();

const {
  register,
  login,
  conversations,
  getConversations,
  messages,
  getMessages,
  getUsers,
  deleteMessage,
} = require("../controller/index.controller");

router.post("/api/register", register);
router.post("/api/login", login);
router.post("/api/conversations", conversations);
router.get("/api/conversations/:userId", getConversations);
router.post("/api/messages", messages);
router.get("/api/messages/:conversationId", getMessages);
router.get("/api/users/:userId", getUsers);
router.delete("/api/message/:messageId", deleteMessage);

module.exports = router;
