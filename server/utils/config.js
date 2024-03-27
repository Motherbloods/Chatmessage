const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const Users = require("../models/user");
const Conversations = require("../models/conversations");
const Messages = require("../models/messages");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "https://chatmessage-client.vercel.app/",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
  transports: ["websocket"],
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let users = [];
let usersActiveConversation = [];

io.on("connection", (socket) => {
  try {
    socket.on("addUser", (userId) => {
      const isUserExist = users.find((user) => user.userId === userId);

      if (!isUserExist) {
        const user = { userId, socketId: socket.id };
        users.push(user);
        io.emit("getUsers", users);
      }
    });
    socket.on("sendActiveUser", ({ aktif, loggedUser, conversationId }) => {
      const usersArray = users.find((user) => user.userId === loggedUser);
      const userIndex = usersActiveConversation.findIndex(
        (user) => user.user?.userId === loggedUser
      );

      if (userIndex !== -1) {
        // Jika pengguna sudah ada dalam usersActiveConversation
        if (
          usersActiveConversation[userIndex].conversationId !== conversationId
        ) {
          // Hapus entri sebelumnya dan tambahkan yang baru
          usersActiveConversation.splice(userIndex, 1);
          usersActiveConversation.push({ user: usersArray, conversationId });
        } else {
          console.log("user sudah aktif dalam percakapan yang sama");
        }
      } else {
        // Jika pengguna belum ada dalam usersActiveConversation, tambahkan ke array
        usersActiveConversation.push({ user: usersArray, conversationId });
      }
      const loggedUserIndex = usersActiveConversation.findIndex(
        (user) => user.user?.userId === loggedUser
      );

      if (!aktif) {
        if (loggedUserIndex !== -1) {
          // If the loggedUser is found, remove it from the array
          usersActiveConversation.splice(loggedUserIndex, 1);
        } else {
          console.log("User not found for loggedUser:", loggedUser);
        }
      }
    });

    socket.on(
      "sendMessage",
      async ({
        senderId,
        receiverId,
        message,
        conversationId,
        date,
        isReply,
        isForward,
        messageOnReply,
        senderOnReply,
      }) => {
        const receiver = users.find((user) => user.userId === receiverId);
        const sender = users.find((user) => user.userId === senderId);

        // Check if receiver is defined before accessing properties

        const user = await Users.findById(senderId);
        if (receiver) {
          io.to(sender.socketId).to(receiver.socketId).emit("getMessage", {
            message,
            conversationId,
            receiverId,
            id: user.id,
            date,
            isForward,
            isReply,
            messageOnReply,
            senderOnReply,
          });
        } else {
          io.to(sender.socketId).emit("getMessage", {
            message,
            conversationId,
            receiverId,
            id: user.id,
            date,
            isReply,
            messageOnReply,
            senderOnReply,
            isForward,
          });
        }
      }
    );
    socket.on(
      "sendConversations",
      async ({ conversationId, receiverId, senderId, message, date }) => {
        try {
          const receiver = users.find((user) => user.userId === receiverId);
          const user = await Users.findById(receiverId);

          const sender = users.find((user) => user.userId === senderId);
          const existingConversation = await Conversations.findOne({
            members: { $all: [senderId, receiverId] },
          });
          if (existingConversation) {
            if (receiver) {
              io.to(sender.socketId)
                .to(receiver.socketId)
                .emit("getConversations", {
                  conversationId: existingConversation._id,
                  user: receiver,
                  senderId,
                  messages: [{ message }],
                  date,
                });
            } else {
              io.to(sender.socketId).emit("getConversations", {
                conversationId: existingConversation._id,
                user: receiver || user,
                senderId,
                messages: [{ message }],
                date,
              });
            }
          }
        } catch (e) {
          console.error("e");
        }
      }
    );

    socket.on(
      "sendLastMessages",
      async ({ loggedUserId, conversationId, lastMessages, read }) => {
        if (lastMessages && lastMessages.length > 0) {
          let receivers;
          let senderUser;
          let receiverUser;
          // Pemilihan Sender dan Receiver
          senderUser = lastMessages[lastMessages.length - 1].id;
          const lastMessage = await Messages.findOne(
            { conversationId: conversationId },
            {},
            { sort: { createdAt: -1 } }
          );
          const conversation = await Conversations.findById(
            lastMessage?.conversationId
          );

          receivers = conversation?.members.filter(
            (member) => member !== senderUser
          );

          const messages = await Messages.find({
            conversationId: conversationId,
          });

          receiverUser = receivers?.toString();

          const senderId = users.find((user) => user.userId === senderUser);
          const receiverId = users.find((user) => user.userId === receiverUser);

          // Cari elemen di usersActiveConversation yang cocok dengan receiverId
          const matchingUserActiveConversation = usersActiveConversation.find(
            (activeUser) => activeUser.user?.userId === receiverId?.userId
          );
          if (matchingUserActiveConversation) {
            await Messages.updateOne(
              { _id: lastMessage._id },
              { $set: { read: true } }
            );

            // Ambil data terbaru dari database setelah pembaruan
            const updatedMessage = await Messages.findOne({
              _id: lastMessage._id,
            });

            // Perbarui lastMessage dengan data terbaru
            if (updatedMessage) {
              lastMessage.read = updatedMessage.read;
            }
          } else {
            console.log("userId tidak cocok atau receiverId tidak ditemukan");
          }
          if (receiverId && senderId) {
            const messagePayload = {
              lastMessage,
              jelas: "pengirim dan receiver",
            };
            io.to(receiverId.socketId)
              .to(senderId.socketId)
              .emit("getLastMessage", messagePayload);
          } else if (receiverId) {
            const messagePayload = {
              lastMessage,
              jelas: "pesan berhasil dikirim  receiver saja",
            };
            io.to(receiverId.socketId).emit("getLastMessage", messagePayload);
          } else if (senderId) {
            const messagePayload = {
              lastMessage,
              jelas: "pesan berhasil dikirim sender sja",
            };
            io.to(senderId.socketId).emit("getLastMessage", messagePayload);
          } else {
            console.error("Tidak ada pengguna yang sesuai.");
          }
        } else {
          console.error("Tidak ada pesan terakhir atau pesan terakhir kosong.");
        }
      }
    );

    socket.on("disconnect", () => {
      users = users.filter((user) => user.socketId !== socket.id);
      io.emit("getUsers", users);
    });
  } catch (err) {
    console.error("Socket error:", err);
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
