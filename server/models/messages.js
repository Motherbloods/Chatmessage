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

// setMessages((prevMessages) => {
//   if (
//     lastMessage &&
//     prevMessages.conversationId ===
//       lastMessage[lastMessage.length - 1].conversationId
//   ) {
//     const updatedMessages = [...prevMessages.message];
//     const newMessages = lastMessage.filter(
//       (msg) =>
//         !prevMessages.message.some((existingMsg) => existingMsg._id === msg._id)
//     );
//     const newMessagesCount = newMessages.length;

//     // Memperbarui properti read hanya untuk pesan-pesan baru
//     for (let i = 0; i < newMessagesCount; i++) {
//       const newMessageIndex = updatedMessages.length - newMessagesCount + i;
//       updatedMessages[newMessageIndex] = {
//         ...updatedMessages[newMessageIndex],
//         read: lastMessage[lastMessage.length - 1].read,
//       };
//     }

//     return {
//       ...prevMessages,
//       message: [...updatedMessages, ...newMessages],
//     };
//   } else {
//     return prevMessages;
//   }
// });
