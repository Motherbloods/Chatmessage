const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const Users = require("../models/user");
const Conversations = require("../models/conversations");
const Messages = require("../models/messages");

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://127.0.0.1:3000",
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
        admin,
        type,
        name,
      }) => {
        const sender = users.find((user) => user.userId === senderId);
        const user = await Users.findById(senderId);
        const messageData = Array.isArray(receiverId)
          ? {
              message: {
                message,
                conversationId,
                receiverId,
                id: user.id,
                date,
                isForward,
                isReply,
                messageOnReply,
                senderOnReply: {
                  nama: senderOnReply.nama,
                  id: senderOnReply.id,
                },
                loggedUserId: senderId,
              },
              admin,
              name,
              type,
              members: receiverId,
            }
          : {
              message,
              conversationId,
              receiverId,
              id: user.id,
              date,
              isForward,
              isReply,
              messageOnReply,
              senderOnReply: {
                nama: senderOnReply.nama,
                id: senderOnReply.id,
              },
              loggedUserId: senderId,
            };

        const receivers = [];

        if (Array.isArray(receiverId)) {
          for (const id of receiverId) {
            const receiver = users.find((user) => user.userId === id);
            if (receiver) {
              receivers.push(receiver);
            }
          }
        } else {
          const receiver = users.find((user) => user.userId === receiverId);
          if (receiver) {
            receivers.push(receiver);
          }
        }

        const socketIds = [
          sender.socketId,
          ...receivers.map((receiver) => receiver.socketId),
        ];

        io.to(socketIds).emit("getMessage", {
          ...messageData,
          admin,
          type,
          name,
          members: receiverId,
        });
      }
    );
    socket.on(
      "sendConversations",
      async ({
        conversationId,
        receiverId,
        senderId,
        message,
        date,
        admin,
        type,
        name,
        img,
      }) => {
        try {
          const sender = users.find((user) => user.userId === senderId);
          const user = await Users.findById(senderId);

          if (Array.isArray(receiverId)) {
            receiverId.forEach(async (id) => {
              const receiver = users.find((user) => user.userId === id);
              if (receiver) {
                io.to(sender?.socketId)
                  .to(receiver?.socketId)
                  .emit("getConversations", {
                    conversationId,
                    admin,
                    members: receiverId,
                    messages: [{ message }],
                    name,
                    type,
                    img,
                  });
              } else {
                io.to(sender?.socketId).emit("getConversations", {
                  conversationId,
                  admin,
                  members: receiverId,
                  messages: [{ message }],
                  name,
                  type,
                  img,
                });
              }
            });
          } else {
            const receiver = users.find((user) => user.userId === receiverId);
            if (receiver) {
              io.to(sender?.socketId)
                .to(receiver?.socketId)
                .emit("getConversations", {
                  conversationId,
                  user: receiver,
                  senderId,
                  messages: [{ message }],
                  date,
                });
            } else {
              io.to(sender?.socketId).emit("getConversations", {
                conversationId,
                user: user || receiver,
                senderId,
                messages: [{ message }],
                date,
              });
            }
          }
        } catch (e) {
          console.error("Error in sendConversations:", e);
        }
      }
    );

    socket.on(
      "sendLastMessages",
      async ({ loggedUserId, conversationId, lastMessages, read }) => {
        if (lastMessages && lastMessages.length > 0) {
          let senderUser;
          let receiverIds;

          senderUser = lastMessages[lastMessages.length - 1].id;

          const lastMessage = await Messages.findOne(
            { conversationId: conversationId },
            {},
            { sort: { createdAt: -1 } }
          );
          const conversation = await Conversations.findById(
            lastMessage?.conversationId
          );
          receiverIds = conversation?.members.filter(
            (member) => member !== senderUser
          );

          const senderId = users.find((user) => user.userId === senderUser);
          const receiverUsers = receiverIds.map((receiverId) =>
            users.find((user) => user.userId === receiverId)
          );

          const matchingUserActiveConversations =
            usersActiveConversation.filter((activeUser) =>
              receiverIds.includes(activeUser.user?.userId)
            );

          if (matchingUserActiveConversations.length > 0) {
            await Messages.updateOne(
              { _id: lastMessage._id },
              { $set: { read: true } }
            );
            const updatedMessage = await Messages.findOne({
              _id: lastMessage._id,
            });
            if (updatedMessage) {
              lastMessage.read = updatedMessage.read;
            }
          } else {
            console.log("userId tidak cocok atau receiverId tidak ditemukan");
          }

          const receiverSocketIds = receiverUsers.flatMap((receiver) =>
            receiver ? [receiver.socketId] : []
          );
          const socketIds = [senderId?.socketId, ...receiverSocketIds];

          const messagePayload = {
            lastMessage,
            jelas: `pengirim dan ${receiverIds.length} penerima`,
          };

          io.to(socketIds).emit("getLastMessage", messagePayload);
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
