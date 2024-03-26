const mongoose = require("mongoose");

const conversationsSchema = new mongoose.Schema({
  members: {
    type: Array,
    required: true,
  },
});

const Conversations = mongoose.model("Conversation", conversationsSchema);

module.exports = Conversations;
