const socketIO = require("socket.io");
const Users = require("../models/user");
const Conversations = require("../models/conversations");
const Messages = require("../models/messages");
let users = [];
let usersActiveConversation = [];

function setupSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://127.0.0.1:3000",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e8,
    transports: ["websocket"],
  });

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

      socket.on("sendActiveUser", ({ loggedUser, conversationId }) => {
        const usersArray = users.find((user) => user.userId === loggedUser);

        const userIndex = usersActiveConversation.findIndex(
          (user) => user.user?.userId === loggedUser
        );

        if (userIndex !== -1) {
          if (
            usersActiveConversation[userIndex].conversationId !== conversationId
          ) {
            usersActiveConversation.splice(userIndex, 1);
            usersActiveConversation.push({ user: usersArray, conversationId });
          } else {
            console.log("user sudah aktif dalam percakapan yang sama");
          }
        } else {
          usersActiveConversation.push({ user: usersArray, conversationId });
        }
      });

      socket.on(
        "sendMessage",
        async ({ senderId, receiverId, message, conversationId, date }) => {
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
            });
          } else {
            io.to(sender.socketId).emit("getMessage", {
              message,
              conversationId,
              receiverId,
              id: user.id,
              date,
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
            const lastMessage = lastMessages[lastMessages.length - 1];
            // Pemilihan Sender dan Receiver
            senderUser = lastMessages[lastMessages.length - 1].id;
            const conversation = await Conversations.findById(
              lastMessage.conversationId
            );
            receivers = conversation.members.filter(
              (member) => member !== senderUser
            );

            receiverUser = receivers.toString();

            const senderId = users.find((user) => user.userId === senderUser);
            const receiverId = users.find(
              (user) => user.userId === receiverUser
            );

            // Cari elemen di usersActiveConversation yang cocok dengan receiverId
            const matchingUserActiveConversation = usersActiveConversation.find(
              (activeUser) => activeUser.user.userId === receiverId?.userId
            );

            if (matchingUserActiveConversation) {
              await Messages.updateOne(
                { _id: lastMessage.messageId },
                { $set: { read: true } }
              );
              // Ambil data terbaru dari database setelah pembaruan
              const updatedMessage = await Messages.findOne({
                _id: lastMessage.messageId,
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
            console.error(
              "Tidak ada pesan terakhir atau pesan terakhir kosong."
            );
          }
        }
      );
    } catch (err) {
      console.error("Socket error:", err);
    }
  });

  return io;
}

module.exports = { setupSocket, users, usersActiveConversation };
