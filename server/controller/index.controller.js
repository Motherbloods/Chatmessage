const User = require("../models/user");
const Conversations = require("../models/conversations");
const Messages = require("../models/messages");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).send("Please fill required fields");
    }

    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error("ini");
    res.status(500).send("Internal Server Error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Please fill required fields");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User email or password incorrect");
    }

    const validateUser = await bcrypt.compare(password, user.password);
    if (!validateUser) {
      return res.status(400).send("User email or password incorrect");
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    const JWT_SCREET_TOKEN = process.env.JWT_SCREET_TOKEN || "THIS_SCRET_TOKEN";

    jwt.sign(
      payload,
      JWT_SCREET_TOKEN,
      { expiresIn: 84600 },
      async (err, token) => {
        if (err) {
          console.error("errpre");
          return res.status(500).send("Kesalahan saat menandatangi JWT");
        }
        await User.updateOne(
          { _id: user._id },
          {
            $set: { token },
          }
        );
        user.save();
        return res.status(200).send({
          user: { id: user._id, email: user.email, fullName: user.fullName },
          token: token,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Kesalahan Internal Server");
  }
};

const conversations = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    const newConversations = new Conversations({
      members: [senderId, receiverId],
    });
    await newConversations.save();
    res.status(200).send("Conversations saved successfully");
  } catch (err) {
    console.error(err);
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Conversations`, userId);

    const conversations = await Conversations.find({
      members: { $in: [userId] },
    });

    const conversationsData = await Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find(
          (member) => member !== userId
        );
        const receiver = await User.findById(receiverId);
        // Retrieve messages for the current conversation
        const messages = await Messages.find({
          conversationId: conversation._id,
        });

        const messagesArray = messages.map((message) => {
          return {
            messageId: message._id,
            message: message.message,
            receiverId: receiver._id,
            id: message.senderId,
            read: message.read,
            date: message.createdAt,
            conversationId: conversation._id,
            isReply: message.isReply,
            isForward: message.isForward,
          };
        });

        return {
          user: {
            id: receiver._id,
            email: receiver.email,
            fullName: receiver.fullName,
          },
          conversationId: conversation._id,
          messages: messagesArray, // Use a separate array for messages
        };
      })
    );

    res.status(200).json({ conversationsData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const messages = async (req, res) => {
  try {
    const {
      conversationId,
      senderId,
      message,
      receiverId,
      isReply,
      isReplyMessageId,
      isForward,
    } = req.body;
    console.log("ini", isForward);
    // Validasi input
    if (!senderId || !message || (conversationId === "new" && !receiverId)) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    if (conversationId === "new") {
      try {
        // Cek apakah percakapan sudah ada antara sender dan receiver
        const existingConversation = await Conversations.findOne({
          members: { $all: [senderId, receiverId] },
        });

        if (existingConversation) {
          // Jika percakapan sudah ada, gunakan conversationId yang ada
          return res.status(200).json({
            conversationId: existingConversation._id,
            senderId,
            receiverId,
            message,
            isReply,
            isReplyMessageId,
            isForward,
          });
        }

        // Jika percakapan belum ada, buat yang baru
        const newConversation = new Conversations({
          members: [senderId, receiverId],
        });
        const savedConversation = await newConversation.save();

        // Buat pesan pertama dalam percakapan baru
        const newMessage = new Messages({
          conversationId: savedConversation._id,
          senderId,
          receiverId,
          message,
          isReply,
          isReplyMessageId,
          isForward,
        });
        await newMessage.save();
        // Respons dengan conversationId yang baru dibuat dan detail pesan
        return res.status(200).json({
          conversationId: savedConversation._id,
          senderId,
          receiverId,
          message: newMessage,
          isReply,
          isReplyMessageId,
          isForward,
        });
      } catch (error) {
        console.error("Error creating new conversation and message:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }

    // Jika conversationId bukan "new", simpan pesan
    const newMessage = new Messages({
      conversationId,
      senderId,
      message,
      isReply,
      isReplyMessageId,
      isForward,
    });
    await newMessage.save();

    return res
      .status(200)
      .json({ success: "Messages sent successfully", newMessage: newMessage });
  } catch (err) {
    console.error("Error in messages route:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId: conversationId });
      const messagesData = await Promise.all(
        messages.map(async (message) => {
          const senderId = await User.findById(message.senderId);
          const cleanedSenderId = senderId._id.toString().trim();

          const replyMessage = await Messages.findById(
            message.isReplyMessageId
          );
          // Extracting the senderId and nama from the replyMessage
          const replySender = await User.findById(replyMessage?.senderId);
          const cleanedReplySenderId = replySender?.fullName;
          const receiverId = req.query.receiverId;
          const conversation = await Conversations.findById(conversationId);
          const receivers = conversation.members.filter(
            (member) => member !== cleanedSenderId
          );

          return {
            loggedUserId: senderId._id,
            messageId: message._id,
            message: message.message,
            id: senderId._id,
            conversationId: conversationId,
            date: message.createdAt,
            read: message.read,
            isReply: message.isReply,
            isForward: message.isForward,
            isReplyMessageId: message.isReplyMessageId,
            senderOnReply: cleanedReplySenderId,
            messageOnReply: replyMessage?.message,
          };
        })
      );
      res.status(200).json({ messagesData });
    };

    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const { senderId, receiverId } = req.query;
      // Cari percakapan yang sudah ada atau buat baru jika tidak ada
      const checkConversation = await Conversations.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (checkConversation) {
        // Jika percakapan sudah ada, gunakan conversationId yang ada
        checkMessages(checkConversation._id);
      } else {
        // Jika percakapan belum ada, buat yang baru
        const newConversation = new Conversations({
          members: [senderId, receiverId],
        });
        const savedConversation = await newConversation.save();

        // Respons dengan conversationId yang baru dibuat dan detail pesan
        res.status(200).json({
          conversationId: savedConversation._id,
          senderId,
          receiverId,
        });
      }
    } else {
      // Jika conversationId bukan "new", ambil pesan dari percakapan yang ada
      checkMessages(conversationId);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const getUsers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await User.find({ _id: { $ne: userId } });
    const usersData = await Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            id: user._id,
          },
        };
      })
    );
    res.status(200).json({ usersData });
  } catch (err) {
    console.log(err);
  }
};

const deleteMessage = async (req, res) => {
  const messageId = req.params.messageId;

  try {
    const deletedMessage = await Messages.findByIdAndDelete(messageId);
    console.log(deletedMessage);
    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

module.exports = {
  register,
  login,
  conversations,
  getConversations,
  messages,
  getMessages,
  getUsers,
  deleteMessage,
};
