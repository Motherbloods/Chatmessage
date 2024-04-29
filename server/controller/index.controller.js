const User = require("../models/user");
const Conversations = require("../models/conversations");
const Messages = require("../models/messages");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    // Mengakses gambar yang diunggah melalui req.files (jika banyak file) atau req.file (jika satu file)
    const imgFiles = req.file;
    if (!fullName || !email || !password) {
      return res.status(400).send("Please fill required fields");
    }

    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      img: imgFiles.path, // Menggunakan path gambar
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
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
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            img: user.img,
          },
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

    // Ambil percakapan di mana pengguna adalah anggota
    const conversations = await Conversations.find({
      members: { $in: [userId] },
    });

    // Proses setiap percakapan dan ambil data yang diperlukan
    const conversationsData = await Promise.all(
      conversations.map(async (conversation) => {
        // Memisahkan informasi untuk percakapan individu dan grup
        if (conversation.type === "group") {
          const messages = await Messages.find({
            conversationId: conversation._id,
          });

          // Format pesan ke dalam array
          const messagesArray = messages.map((message) => ({
            messageId: message._id,
            message: message.message,
            id: message.senderId,
            read: message.read,
            date: message.createdAt,
            conversationId: conversation._id,
            isReply: message.isReply,
            isForward: message.isForward,
          }));
          // Ambil informasi percakapan grup
          return {
            conversationId: conversation._id,
            type: conversation.type,
            name: conversation.name,
            members: conversation.members,
            admin: conversation.admin,
            img: conversation.img,
            messages: messagesArray,
            createdAt: conversation.createdAt,
            description: conversation.description,
          };
        } else {
          // Ambil ID penerima jika percakapan individu
          const receiverId = conversation.members.find(
            (member) => member.toString() !== userId
          );
          const receiver = await User.findById(receiverId);

          // Ambil pesan untuk percakapan ini
          const messages = await Messages.find({
            conversationId: conversation._id,
          });

          // Format pesan ke dalam array
          const messagesArray = messages.map((message) => ({
            messageId: message._id,
            message: message.message,
            receiverId: receiver ? receiver._id : "",
            id: message.senderId,
            read: message.read,
            date: message.createdAt,
            conversationId: conversation._id,
            isReply: message.isReply,
            isForward: message.isForward,
          }));

          // Kembalikan data percakapan individu dengan pesan
          return {
            user: {
              id: receiver ? receiver._id : "",
              email: receiver ? receiver.email : "",
              fullName: receiver ? receiver.fullName : "",
              img: receiver ? receiver.img : "",
            },
            type: conversation.type,
            conversationId: conversation._id,
            messages: messagesArray,
          };
        }
      })
    );

    // Kirim respons dengan data percakapan
    res.status(200).json({ conversationsData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, adminId, members, description, createdAt } = req.body;

    if (!members.includes(adminId)) {
      members.push(adminId);
    }

    const newGroupConversation = new Conversations({
      name,
      admin: adminId,
      members: members.map((memberId) => new mongoose.Types.ObjectId(memberId)),
      createdAt,
      description,
      type: "group",
    });

    const savedGroupConversation = await newGroupConversation.save();
    // Kirim respons sukses dengan data grup baru
    res.status(200).json({
      success: "Group created successfully",
      group: savedGroupConversation,
    });
  } catch (err) {
    console.error("Error creating group:", err);
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
      type,
    } = req.body;
    // Validasi input
    if (!senderId || !message || (conversationId === "new" && !receiverId)) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    if (conversationId === "new") {
      try {
        let newConversation;

        // Jika tipe percakapan adalah 'group'
        if (type === "group") {
          // Cek apakah percakapan grup sudah ada antara sender dan semua anggota receiver
          newConversation = await Conversations.findOne({
            members: { $all: [senderId, ...receiverId] },
          });

          if (!newConversation) {
            // Jika percakapan grup belum ada, buat percakapan grup baru
            newConversation = new Conversations({
              members: [senderId, ...receiverId],
            });
            await newConversation.save();
          }
        } else {
          // Jika bukan grup, buat percakapan individu
          // Cek apakah percakapan individu sudah ada
          newConversation = await Conversations.findOne({
            members: { $all: [senderId, receiverId] },
          });

          if (!newConversation) {
            // Jika percakapan individu belum ada, buat percakapan baru
            newConversation = new Conversations({
              members: [senderId, receiverId],
            });
            await newConversation.save();
          }
        }

        // Buat pesan pertama dalam percakapan baru
        const newMessage = new Messages({
          conversationId: newConversation._id,
          senderId,
          receiverId: type === "group" ? receiverId : receiverId, // Set receiverId berdasarkan type
          message,
          isReply,
          isReplyMessageId,
          isForward,
        });
        await newMessage.save();

        // Respons dengan conversationId yang baru dibuat dan detail pesan
        return res.status(200).json({
          conversationId: newConversation._id,
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

    // Jika conversationId bukan 'new', simpan pesan ke percakapan yang ada
    const newMessage = new Messages({
      conversationId,
      senderId,
      message,
      isReply,
      isReplyMessageId,
      isForward,
    });
    await newMessage.save();
    return res.status(200).json({
      success: "Messages sent successfully",
      newMessage,
    });
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

          if (conversation.type === "group") {
            return {
              message: {
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
                senderOnReply: {
                  nama: cleanedReplySenderId,
                  id: replySender?._id,
                },
                messageOnReply: replyMessage?.message,
              },
              members: conversation.members,
              admin: conversation.admin,
              name: conversation.name,
              type: conversation.type,
            };
          } else {
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
              senderOnReply: {
                nama: cleanedReplySenderId,
                id: replySender?._id,
              },
              messageOnReply: replyMessage?.message,
            };
          }
          const receivers = conversation.members.filter(
            (member) => member !== cleanedSenderId
          );
        })
      );
      res.status(200).json({ messagesData });
    };

    const conversationId = req.params.conversationId;
    const { senderId, receiverId, type } = req.query;
    if (conversationId === "new" && type === "individual") {
      // if (type === "group") {
      //   // Percakapan grup
      //   const newConversation = new Conversations({
      //     members: [senderId, ...receiverId.split(",")], // Menambahkan senderId dan semua anggota grup
      //   });
      //   const savedConversation = await newConversation.save();
      //   res.status(200).json({
      //     conversationId: savedConversation._id,
      //     senderId,
      //     receiverId,
      //   });
      // } else {
      // }

      // Cari percakapan yang sudah ada atau buat baru jika tidak ada
      const checkConversation = await Conversations.findOne({
        members: { $all: [senderId, receiverId] },
      });

      if (checkConversation && checkConversation.type === "individual") {
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
            img: user.img,
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
    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

const updateImg = async (req, res) => {
  try {
    const id = req.params.id;
    const imgFile = req.file;
    // Cari percakapan atau user berdasarkan ID
    let dataToUpdate;
    let conversationIdUser = [];
    let receiverId = [];
    // Cek apakah percakapan ada
    let conversation = await Conversations.findById(id);

    if (!conversation) {
      let conversations = await Conversations.find({ members: id });

      // Jika tidak ada percakapan di mana pengguna adalah anggota
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Data not found" });
      }

      // Jika ditemukan, simpan data pengguna untuk diperbarui
      dataToUpdate = user;

      // Jika ada percakapan di mana pengguna adalah anggota, simpan ID percakapan untuk diperbarui
      conversationIdUser = conversations.map(
        (conversation) => conversation._id
      );
      receiverId = conversations.reduce((acc, conv) => {
        return acc.concat(
          conv.members.filter(
            (member) => member.toString() !== id && member !== ""
          )
        ); // Menambahkan filter untuk memastikan member tidak sama dengan id dan memiliki nilai ID yang valid
      }, []);
    } else {
      // Jika percakapan ditemukan, simpan data percakapan untuk diperbarui
      dataToUpdate = conversation;
    }
    // Perbarui properti img dari percakapan dengan nilai yang sesuai dari req.file
    const path = imgFile.path;
    const index = path.indexOf("uploads");

    // Mengambil substring dari indeks 'uploads' hingga akhir string
    const relativePath = path.substring(index);
    dataToUpdate.img = relativePath;
    // Simpan perubahan
    await dataToUpdate.save();
    // Persiapkan data yang akan dikirim ke frontend
    const dataToSend = conversation
      ? {
          conversationId: dataToUpdate._id,
          senderId: dataToUpdate.admin,
          members: dataToUpdate.members,
          admin: dataToUpdate.admin,
          type: dataToUpdate.type,
          name: dataToUpdate.name,
          img: dataToUpdate.img,
        }
      : {
          conversationId: conversationIdUser,
          messages: "",
          receiverId,
          type: dataToUpdate.type,
          user: {
            email: dataToUpdate.email,
            fullName: dataToUpdate.fullName,
            id: dataToUpdate._id,
            img: dataToUpdate.img,
          },
        };

    // Kirim respons ke klien dengan data yang disiapkan
    res.status(200).json({
      message: "Image updated successfully",
      data: dataToSend,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    // Kirim respons error ke klien
    res.status(500).json({ error: error.message });
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
  createGroup,
  updateImg,
};
