const controller = require("../controller/index.controller");

function socketLogic(io, users, usersActiveConversation) {
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

        // Cari indeks pengguna dalam usersActiveConversation berdasarkan userId
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
      });

      socket.on("sendMessage", async (data) => {
        await controller.handleMessages(io, data);
        console.log("ini getmessage");
        // Handle "getmessage"
        // ...
      });

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
          console.log("lastmessage");
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
              console.log(lastMessage.messageId);
              // Ambil data terbaru dari database setelah pembaruan
              const updatedMessage = await Messages.findOne({
                _id: lastMessage.messageId,
              });
              console.log("ini udpate", updatedMessage);

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

      socket.on("disconnect", () => {
        users = users.filter((user) => user.socketId !== socket.id);
        io.emit("getUsers", users);
      });
    } catch (err) {
      console.error("Socket error:", err);
    }
  });
}

module.exports = { socketLogic };
