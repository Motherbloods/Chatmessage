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

router.post("/register", register);
router.post("/login", login);
router.post("/conversations", conversations);
router.get("/conversations/:userId", getConversations);
router.post("/messages", messages);
router.get("/messages/:conversationId", getMessages);
router.get("/users/:userId", getUsers);
router.delete("/message/:messageId", deleteMessage);

module.exports = router;
