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
          usersActiveConversation.push({
            user: usersArray,
            conversationId,
            date: new Date(),
          });
        } else {
        }
      } else {
        // Jika pengguna belum ada dalam usersActiveConversation, tambahkan ke array
        usersActiveConversation.push({
          user: usersArray,
          conversationId,
          date: new Date(),
        });
      }
      const loggedUserIndex = usersActiveConversation.findIndex(
        (user) => user.user?.userId === loggedUser
      );

      if (!aktif) {
        if (loggedUserIndex !== -1) {
          // If the loggedUser is found, remove it from the array
          usersActiveConversation.splice(loggedUserIndex, 1);
        } else {
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
        read,
      }) => {
        const sender = users.find((user) => user.userId === senderId);
        const userReceiverOnConversation = usersActiveConversation.find(
          (item) => {
            if (item.conversationId === conversationId) {
              if (item.user?.userId === receiverId) {
                return true;
              }
            }
            return false;
          }
        );

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
                read: userReceiverOnConversation ? true : false,
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
              id: user?.id,
              date,
              isForward,
              isReply,
              read: userReceiverOnConversation ? true : false,
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
        console.log(socketIds);

        io.to(socketIds).emit("getMessage", {
          ...messageData,
          admin,
          type,
          name,
          conversationId,
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
        userId,
        description,
      }) => {
        console.log(
          "ini ",
          conversationId,
          receiverId,
          senderId,
          message,
          date,
          admin,
          type,
          name,
          img,
          userId,
          description
        );
        try {
          const sender = users.find((user) => user.userId === senderId);
          const messages = message === null ? [] : { message };
          if (Array.isArray(receiverId)) {
            if (Array.isArray(conversationId)) {
              receiverId.forEach(async (id) => {
                const receiver = users.find((user) => user.userId === id);
                if (receiver) {
                  io.to(sender?.socketId)
                    .to(receiver?.socketId)
                    .emit("getConversations", {
                      conversationId,
                      user: {
                        id: userId.id,
                        img,
                      },
                      messages,
                      type,
                    });
                } else {
                  io.to(sender?.socketId).emit("getConversations", {
                    conversationId,
                    user: {
                      id: userId.id,
                      img,
                    },
                    messages,
                    type,
                  });
                }
              });
            } else {
              receiverId.forEach(async (id) => {
                const receiver = users.find((user) => user.userId === id);
                if (receiver) {
                  io.to(sender?.socketId)
                    .to(receiver?.socketId)
                    .emit("getConversations", {
                      conversationId,
                      admin,
                      members: receiverId,
                      messages,
                      name,
                      type,
                      img,
                      description,
                    });
                } else {
                  io.to(sender?.socketId).emit("getConversations", {
                    conversationId,
                    admin,
                    members: receiverId,
                    messages,
                    name,
                    type,
                    img,
                    description,
                  });
                }
              });
            }
          } else {
            const receiver = users.find((user) => user.userId === receiverId);
            const user = await Users.findById(receiverId);
            if (receiver) {
              io.to(sender?.socketId)
                .to(receiver?.socketId)
                .emit("getConversations", {
                  conversationId,
                  user: {
                    id: user._id,
                    img: user.img,
                    fullName: user.fullName,
                  },
                  senderId,
                  messages,
                  date,
                });
            } else {
              io.to(sender?.socketId).emit("getConversations", {
                conversationId,
                user: {
                  id: user._id,
                  img: user.img,
                  fullName: user.fullName,
                },
                senderId,
                messages,
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
      async ({
        loggedUserId,
        messageId,
        receiverId,
        conversationId,
        read,
        lastMessages,
      }) => {
        const checkMembers = await Conversations.findById(conversationId);
        if (checkMembers.type === "group") {
          let senderUser;
          const members = checkMembers?.members.filter((member) =>
            member.toString()
          );
          senderUser = lastMessages[lastMessages.length - 1]?.message?.id;
          // Socket id
          const senderId = users.find((user) => user.userId === senderUser);
          const receiverUsers = members?.map((receiverId) =>
            users?.find((user) => user?.userId === receiverId?.toString())
          );

          const checkUsersOnCoversation = usersActiveConversation.filter(
            (activeUser) =>
              members?.toString()?.includes(activeUser.user?.userId)
          );

          if (checkUsersOnCoversation.length > 0) {
            const userIds = checkUsersOnCoversation.reduce((acc, item) => {
              if (item.conversationId === conversationId) {
                const existingUserIndex = acc.findIndex(
                  (u) => u.userId === item.user.userId
                );
                if (existingUserIndex !== -1) {
                  // Jika user sudah ada di array, pertahankan nilai date yang sudah ada
                  const existingUser = acc[existingUserIndex];
                  existingUser.date = existingUser.date || item.date;
                } else {
                  // Jika user baru, tambahkan dengan nilai date terbaru
                  acc.push({ userId: item.user.userId, date: item.date });
                }
              }
              return acc;
            }, []);

            const akhir = await Messages.findOne(
              { conversationId: conversationId },
              {},
              { sort: { createdAt: -1 } }
            );
            if (userIds.length === members.length) {
              const helo = await Messages.updateMany(
                {
                  conversationId: { $in: conversationId },
                },
                { $set: { read: true } }
              );
            }

            const lastMessage = await Messages.find({
              conversationId: conversationId,
            });

            const receiverSocketIds = receiverUsers?.flatMap((receiver) =>
              receiver ? [receiver.socketId] : []
            );
            const socketIds = [senderId?.socketId, ...receiverSocketIds];

            const messagePayload = {
              lastMessage,
              date: userIds,
              type: "group",
              jelas: `pengirim dan ${members.length} penerima`,
            };

            io.to(socketIds).emit("getLastMessage", messagePayload);
          }
        } else {
          if (lastMessages && lastMessages.length > 0) {
            let senderUser;
            let receiverIds;

            const checkMessgae = lastMessages[lastMessages.length - 1].members;
            senderUser = checkMessgae
              ? lastMessages[lastMessages.length - 1].message.id
              : lastMessages[lastMessages.length - 1].id;

            const conversation = await Conversations.findById(conversationId);

            members = conversation?.members.filter((member) =>
              member.toString()
            );

            // Socket id
            const senderId = users.find((user) => user.userId === senderUser);
            const receiverUsers = members?.map((receiverId) =>
              users?.find((user) => user?.userId === receiverId?.toString())
            );

            const matchingUserActiveConversations =
              usersActiveConversation.filter((activeUser) =>
                members?.toString()?.includes(activeUser.user?.userId)
              );

            if (matchingUserActiveConversations.length > 0) {
              const userIds = matchingUserActiveConversations.reduce(
                (acc, item) => {
                  if (item.conversationId === conversationId) {
                    acc.push(item.user.userId);
                  }
                  return acc;
                },
                []
              );

              const akhir = await Messages.findOne(
                { conversationId: conversationId },
                {},
                { sort: { createdAt: -1 } }
              );

              const included = akhir.senderId.includes(userIds);

              if (userIds.length === 1) {
                const halo = await Messages.updateMany(
                  {
                    senderId: { $nin: userIds },
                    conversationId: { $in: conversationId },
                  },
                  { $set: { read: true } }
                );
              } else if (userIds.length > 1) {
                const helo = await Messages.updateMany(
                  {
                    conversationId: { $in: conversationId },
                  },
                  { $set: { read: true } }
                );
              } else {
                const hahlo = await Messages.updateMany(
                  {
                    senderId: { $nin: userIds },
                    conversationId: { $in: conversationId },
                  },
                  { $set: { read: true } }
                );
              }
            } else {
            }
            const lastMessage = await Messages.find(
              { conversationId: conversationId } // Query: temukan pesan dengan conversationId tertentu
            );

            const receiverSocketIds = receiverUsers?.flatMap((receiver) =>
              receiver ? [receiver.socketId] : []
            );
            const socketIds = [senderId?.socketId, ...receiverSocketIds];
            const messagePayload = {
              lastMessage,
              loggedUserId,
              type: "individual",
              jelas: `pengirim dan ${members.length} penerima`,
            };

            io.to(socketIds).emit("getLastMessage", messagePayload);
          } else {
          }
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
