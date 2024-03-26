const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
  },
  senderId: {
    type: String,
  },
  message: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  isReplyMessageId: {
    type: String,
    default: null,
  },
  isForward: {
    type: Boolean,
    default: false,
  },
});

const Messages = mongoose.model("Message", messageSchema);

module.exports = Messages;
