import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "../../components/Input";
import { io } from "socket.io-client";
import Emoticon from "../../components/Emoticon";
import Reply from "../../components/Reply";
import Search from "../../components/Search";
import NewChatButton from "../../components/NewChatButton";
import Forward from "../../components/Forward";
import MenuButton from "../../components/MenuButton";
import MenuProfile from "../../components/MenuProfile";
import "../../index.css";
import ViewProfileGroub from "../../components/ViewProfileGroub";

const Dashboard = () => {
  const currentConversationIdRef = useRef(null);
  const emoticonRef = useRef(null);
  const replyRef = useRef({});
  const chatContainerRef = useRef(null);
  const messageRef = useRef(null);
  const messageIdRef = useRef({});
  const [replyPosition, setReplyPosition] = useState({ top: 0, left: 0 });
  const loggedUser = JSON.parse(localStorage.getItem("user:detail"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [userInConversation, setUserInConversation] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [onConversation, setOnConversation] = useState(false);
  const [lastMessages, setLastMessages] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({ message: [] });
  const [message, setMessage] = useState([]);
  const [socket, setSocket] = useState(null);
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showReplyForMessageId, setShowReplyForMessageId] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState([]);
  const [isReply, setIsReply] = useState(false);
  const [isForward, setIsForward] = useState(false);
  const [popUpForm, setPopUpForm] = useState(false);
  const [replyData, setReplyData] = useState({
    senderId: {
      nama: "",
      id: "",
    },
    message: "",
    messageId: "",
  });
  const [menuClick, setMenuClick] = useState(false);
  const [imgClick, setImageClick] = useState(false);
  const [groupData, setGroupData] = useState({
    name: "",
    members: "",
    admin: "",
    conversationId: "",
  });
  const [createGroupData, setCreateGroupData] = useState({});
  useEffect(() => {
    // Update ref when state changes
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    const socketInstance = io("http://127.0.0.1:8080", {
      transports: ["websocket"],
    });
    setSocket(socketInstance);

    return () => {
      // Cleanup code when the component unmounts
      socketInstance.disconnect();
    };
  }, []);
  const handleEmoticonClicks = (event, messageId) => {
    // Mendapatkan posisi klik menggunakan event object
    const { clientX, clientY } = event;
    setReplyPosition({ top: clientY, left: clientX });
  };
  const conversationIdsSet = new Set(
    conversations.map((conversation) => conversation.conversationId)
  );
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("addUser", user.id);
      socket.on("getUsers", (users) => {});
      socket.on("getMessage", (data) => {
        const isGroupConversation = Array.isArray(data.message.receiverId);
        const conversationId =
          data.conversationId || data.message.conversationId;
        if (
          isGroupConversation &&
          conversationId &&
          data.type !== "individual"
        ) {
          if (currentConversationIdRef.current === conversationId) {
            // Jika receiverId adalah array
            setMessages((prevMessages) => {
              const newMessage = {
                admin: data.admin,
                members: data.members,
                message: {
                  id: data.message.id,
                  message: data.message.message,
                  date: data.message.date,
                  isReply: data.message.isReply,
                  messageOnReply: data.message.messageOnReply,
                  senderOnReply: data.message.senderOnReply,
                  isForward: data.message.isForward,
                  loggedUserId: data.message.loggedUserId,
                  conversationId: data.message.conversationId,
                  read: data.message.read,
                  // tambahkan properti lainnya yang diperlukan
                },
                name: data.name,
                type: data.type,
              };
              setConversations((prevConversations) => {
                // Find the conversation that needs to be updated
                return prevConversations.map((conversation) =>
                  conversation.conversationId === data.message.conversationId
                    ? {
                        ...conversation,
                        messages: [
                          ...conversation.messages,
                          newMessage.message,
                        ],
                      }
                    : conversation
                );
              });
              return [...prevMessages, newMessage];
            });
          }
        } else {
          if (data.conversationId) {
            if (
              !Array.isArray(
                (data.message.receiverId || data.receiverId) &&
                  data.type === "individual"
              )
            ) {
              setMessages((prev) => {
                const messagesArray = prev.message || [];
                const updatedMessages = [
                  ...messagesArray,
                  {
                    conversationId: data.conversationId,
                    id: data.id,
                    message: data.message,
                    date: data.date,
                    isReply: data.isReply,
                    messageOnReply: data.messageOnReply,
                    senderOnReply: data.senderOnReply,
                    isForward: data.isForward,
                    read: data.read, // Menambahkan properti read dengan nilai false untuk pesan baru
                  },
                ];

                setConversations((prevConversations) => {
                  // Find the conversation that needs to be updated
                  return prevConversations.map((conversation) =>
                    conversation.conversationId === data.conversationId
                      ? {
                          ...conversation,
                          messages: [
                            ...conversation.messages,
                            {
                              conversationId: data.conversationId,
                              id: data.id,
                              message: data.message,
                              date: data.date,
                              isReply: data.isReply,
                              messageOnReply: data.messageOnReply,
                              senderOnReply: data.senderOnReply,
                              isForward: data.isForward,
                              read: data.read, // Menambahkan properti read dengan nilai false untuk pesan baru
                            },
                          ],
                        }
                      : conversation
                  );
                });

                return {
                  ...prev,
                  message: updatedMessages,
                };
              });
            }
          }
        }
        // if (Array.isArray(data.receiverId)) {
        // }
      });

      socket.on("getConversations", (data) => {
        console.log(data);
        if (Array.isArray(data.conversationId)) {
          data.conversationId.forEach((id) => {
            if (!conversationIdsSet.has(id)) {
              setConversations((prev) => {
                const existingConversation = prev?.find(
                  (conv) => conv.conversationId === id
                );
                const imgChange = prev?.find(
                  (conv) =>
                    conv?.user !== undefined &&
                    conv?.user?.img === data?.user?.img
                );

                if (existingConversation && imgChange) {
                  return prev;
                } else if (!imgChange) {
                  const updatedPrev = prev?.map((conv) => {
                    if (conv.user && conv.user.id === data.user.id) {
                      return {
                        ...conv,
                        user: { ...conv.user, img: data.user.img },
                      };
                    } else {
                      return conv;
                    }
                  });

                  return updatedPrev;
                } else {
                  conversationIdsSet.add(data.conversationId);
                  return prev;
                }
              });
            }
          });
        } else {
          if (!conversationIdsSet.has(data.conversationId)) {
            setConversations((prev) => {
              const existingConversation = prev.find(
                (conv) => conv.conversationId === data.conversationId
              );
              const imgChange = prev.find((conv) => conv.img === data.img);
              if (prev.length === 0) {
                conversationIdsSet.add(data.conversationId);
                return [...prev, data];
              } else if (existingConversation && imgChange) {
                return prev;
              } else if (!imgChange) {
                const updatedPrev = prev.map((conv) => {
                  if (conv.conversationId === data.conversationId) {
                    return { ...conv, img: data.img };
                  }
                  return conv;
                });
                return updatedPrev;
              } else {
                conversationIdsSet.add(data.conversationId);
                return [...prev, data];
              }
            });
          }
        }
      });
      socket.on("getLastMessage", (data) => {
        const { lastMessage } = data;
        setMessages((prevMessages) => {
          if (
            lastMessage &&
            prevMessages.conversationId ===
              lastMessage[lastMessage?.length - 1].conversationId
          ) {
            const updatedMessages = [...prevMessages.message];
            const newMessages = lastMessage.filter(
              (msg) =>
                !prevMessages.message.some(
                  (existingMsg) => existingMsg._id === msg._id
                )
            );
            const newMessagesCount = newMessages.length;
            for (
              let i = updatedMessages.length - newMessagesCount;
              i < updatedMessages.length;
              i++
            ) {
              updatedMessages[i] = {
                ...updatedMessages[i],
                read: lastMessage[lastMessage.length - 1].read,
              };
            }
            console.log(newMessagesCount);

            return {
              ...prevMessages,
              message: updatedMessages,
            };
          } else {
            return prevMessages;
          }
        });
        setConversations((prevConversations) => {
          return prevConversations.map((conversation) => {
            if (
              conversation.conversationId ===
              lastMessage[lastMessage?.length - 1].conversationId
            ) {
              const updatedMessages = [...conversation.messages];
              const newMessagesCount = lastMessage.filter(
                (msg) =>
                  !conversation.messages.some(
                    (existingMsg) => existingMsg._id === msg._id
                  )
              ).length;

              for (
                let i = updatedMessages.length - newMessagesCount;
                i < updatedMessages.length;
                i++
              ) {
                if (updatedMessages[i]) {
                  updatedMessages[i].read =
                    lastMessage[lastMessage.length - 1].read;
                }
              }

              return {
                ...conversation,
                messages: updatedMessages,
              };
            } else {
              return conversation;
            }
          });
        });

        setLastMessages(lastMessage ? lastMessage[lastMessage.length - 1] : "");
      });

      // Membersihkan event listener pada unmount komponen
      return () => {
        socket.off("getLastMessage");
      };
    }
  }, [socket, user.id, messages?.message?.id]);
  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.[messages.length - 1]?.message || messages?.message]);
  // useEffect(() => {
  //   if (messageIdRef.current) {
  //     messageIdRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages?.[messages.length - 1]?.message || messages?.message]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        replyRef.current &&
        replyRef.current.contains &&
        replyRef.current.contains(event.target)
      ) {
        setShowReply(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []); // Include emoticonRef.current in the dependency array

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          ` http://127.0.0.1:8000/api/conversations/${loggedUser.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const resData = await res.json();

        resData.conversationsData.forEach((conversation) => {
          socket.emit("sendActiveUser", {
            aktif: false,
            loggedUser: loggedUser.id,
            conversationId: conversation.conversationId,
          });
          // Check if the conversation has messages
          if (conversation.messages && conversation.messages.length > 0) {
            // Set the last message as lastMessage
            const lastMessage =
              conversation.messages[conversation.messages.length - 1];

            setLastMessages(lastMessage);

            const { conversationId, messages, user, type } = conversation;

            // Assuming socket is already defined
            if (socket) {
              socket.emit("sendLastMessages", {
                loggedUserId: loggedUser.id,
                date: message.date,
                read: message.read,
                conversationId,
                receiverId: messages.receiverId,
                lastMessages: messages,
              });
            } else {
              console.error("Socket is null or undefined.");
            }
          } else {
            setLastMessages([]);
          }
        });
        if (Array.isArray(resData.conversationsData)) {
          setConversations(resData.conversationsData);
        } else {
          console.error("Invalid conversationsData format:", resData);
          // Handle the error or set conversations to an empty array
          setConversations([]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        // Handle the error or set conversations to an empty array
        setConversations([]);
      }
    };

    fetchConversations();
  }, [loggedUser.id, socket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(` http://127.0.0.1:8000/api/users/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const resData = await res.json();
        setUsers(resData.usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Handle the error, e.g., setUsers([]) or display an error message
      }
    };

    // Memanggil fetchUsers setiap kali users berubah
    fetchUsers();
  }, [user.id]);

  const handleNewOrNoConcersation = (userId, message, forward) => {
    // const targetConversation = conversations.find(
    //   (conv) => conv.user && conv.user.id === userId.id
    // );
    let targetConversation;
    if (userId && typeof userId === "object" && userId.id) {
      // Cari percakapan berdasarkan ID pengguna
      targetConversation = conversations.find(
        (conv) => conv.user && conv.user.id === userId.id
      );
    } else if (Array.isArray(userId)) {
      // Cari percakapan berdasarkan ID pengguna pertama
      targetConversation = conversations.find(
        (conv) => conv.members === userId
      );
    } else {
      // Jika userId tidak valid, keluarkan pesan kesalahan atau tangani kasus ini sesuai kebutuhan Anda
      console.error("Invalid userId format");
      return;
    }

    if (forward) {
      fetchMessages(
        targetConversation ? targetConversation.conversationId : "new",
        userId,
        message,
        targetConversation ? targetConversation.type : "individual",
        targetConversation ? targetConversation.name : "",
        true
      );
    } else {
      fetchMessages(
        targetConversation ? targetConversation.conversationId : "new",
        userId,
        message,
        targetConversation ? targetConversation.type : "individual",
        targetConversation ? targetConversation.name : ""
      );
    }
  };
  const fetchMessages = async (
    conversationId,
    user,
    message,
    type,
    name,
    admin,
    forward
  ) => {
    try {
      let url;
      if (type === "group") {
        // if (Array.isArray(user)) {
        //   const filteredMembers = user.filter(
        //     (member) => member !== loggedUser.id
        //   );
        setGroupData({
          name: name,
          members: user,
          admin: admin,
          conversationId: conversationId,
        });

        url = ` http://127.0.0.1:8000/api/messages/${conversationId}?senderId=${loggedUser.id}&type=${type}`;
      } else {
        setGroupData({
          name: "",
          members: "",
          admin: "",
          conversationId: "",
        });
        url = ` http://127.0.0.1:8000/api/messages/${conversationId}?receiverId=${user.id}&senderId=${loggedUser.id}&type=${type}`;
      }
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resData = await res.json();
      if (conversationId === "new" && type === "individual") {
        const newConversationId = resData.conversationId;
        if (resData.messagesData && resData.messagesData.length === 0) {
          socket.emit("sendLastMessages", {
            conversationId: newConversationId,
            lastMessages: [],
          });
        } else if (resData.messagesData) {
          const messagesData = resData.messagesData;
          const lastMessage = messagesData[messagesData.length - 1];

          const messageId = lastMessage.messageId;

          socket.emit("sendLastMessages", {
            loggedUserId: loggedUser.id,
            messageId,
            receiverId: messages.receiverId,
            conversationId: newConversationId,
            read: true,
            lastMessages: [lastMessage],
          });
        } else {
          // Handle the case where resData.messagesData is undefined or null
          console.error("Error: messagesData is undefined or null");
        }
        socket.emit("sendActiveUser", {
          aktif: true,
          loggedUser: loggedUser.id,
          conversationId: newConversationId,
        });

        setMessages({
          message: resData.messagesData,
          receiver: user,
          conversationId: newConversationId,
        });
        setCurrentConversationId(newConversationId);
        if (forward && message) {
          sendMessages(newConversationId, user, message);
        }
      } else {
        if (resData.messagesData && resData.messagesData.length === 0) {
          socket.emit("sendLastMessages", { conversationId, lastMessages: [] });
        } else if (resData.messagesData) {
          const messagesData = resData.messagesData;
          const lastMessage = messagesData[messagesData.length - 1];
          const messageId = lastMessage.messageId;
          setLastMessages(lastMessage);
          // if (lastMessage.id === loggedUser.id) {
          // Jika id pengirim (sender) sama dengan loggeduser.id
          socket.emit("sendLastMessages", {
            loggedUserId: loggedUser.id,
            messageId,
            receiverId: messages.receiverId,
            conversationId,
            read: true,
            lastMessages: [lastMessage],
          });
          if (type === "individual") {
            setMessages({
              message: resData.messagesData,
              receiver: user,
              conversationId,
            });
          } else {
            setMessages(resData.messagesData);
          }

          socket.emit("sendActiveUser", {
            aktif: true,
            loggedUser: loggedUser.id,
            conversationId,
          });
        } else {
          // Handle the case where resData.messagesData is undefined or null
          console.error("Error: messagesData is undefined or null");
        }
        setCurrentConversationId(conversationId);
        if (forward && message) {
          sendMessages(conversationId, user, message);
        }
      }
      setUserInConversation(true);
      setOnConversation(true);
      setImageClick(false);
      setTimeout(() => {
        // Mendapatkan semua elemen pesan yang memiliki background color merah
        const redMessageElements =
          document?.querySelectorAll("[style='background-color: red;']") || [];

        // Menghapus background color merah dari semua elemen pesan yang memiliki background color merah
        redMessageElements.forEach((element) => {
          element.style.backgroundColor = "";
        });

        // Mendapatkan elemen dengan ID tertentu
        const containerElement = document.getElementById(message.messageId);

        // Jika containerElement ditemukan, lanjutkan proses
        if (containerElement) {
          // Mendapatkan elemen <p> kedua di dalam elemen tersebut
          const paragraphs = containerElement.querySelectorAll("p");

          // Mencari elemen <p> yang berisi teks yang sesuai dengan message.message
          let secondParagraph = null;
          paragraphs.forEach((paragraph) => {
            if (paragraph.textContent.includes(message.message)) {
              secondParagraph = paragraph;
              return; // Keluar dari loop forEach setelah menemukan elemen yang sesuai
            }
          });

          // Jika elemen ditemukan, atur background color-nya menjadi merah
          if (secondParagraph) {
            secondParagraph.style.backgroundColor = "red";
            containerElement.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }
      }, 100);

      // setSearchValue("");
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Handle the error or set messages to an empty array
      setMessages({ message: [], receiver: null, conversationId: null });
    }
  };

  const sendMessages = async (
    conversationIdForward,
    userForward,
    messageforward
  ) => {
    const currentDate = new Date(); // Get the current date and time
    try {
      let members;
      if (Array.isArray(messages)) {
        const filteredMembers = groupData.members.filter(
          (member) => member !== loggedUser.id
        );
        members = filteredMembers;
      }

      const body =
        conversationIdForward && userForward && messageforward
          ? JSON.stringify({
              conversationId: conversationIdForward,
              senderId: user.id,
              receiverId: messages.receiver ? messages.receiver.id : members,
              message: messageforward,
              date: currentDate.toISOString(),
              isForward: true,
              type: members ? "group" : "individual",
            })
          : !isReply
          ? JSON.stringify({
              conversationId: messages.conversationId
                ? messages.conversationId
                : groupData.conversationId,
              senderId: user.id,
              receiverId: messages.receiver ? messages.receiver.id : members,
              message,
              date: currentDate.toISOString(),
              type: members ? "group" : "individual",
            })
          : JSON.stringify({
              conversationId: messages.conversationId
                ? messages.conversationId
                : groupData.conversationId,
              senderId: user.id,
              receiverId: messages.receiver ? messages.receiver.id : members,
              message,
              isReply: true,
              isReplyMessageId: replyData.messageId,
              date: currentDate.toISOString(),
              type: members ? "group" : "individual",
            });

      const res = await fetch(` http://127.0.0.1:8000/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      if (res.ok) {
        const conversationId =
          conversationIdForward ||
          messages.conversationId ||
          groupData.conversationId;
        const receiverId = userForward
          ? userForward.id
          : messages.receiver
          ? messages.receiver?.id
          : members;
        const messageOne = messageforward ? messageforward : message;
        // After successfully sending the message, emit sendConversations
        socket.emit("sendConversations", {
          conversationId,
          senderId: user.id,
          receiverId,
          message: messageOne,
          date: currentDate.toISOString(),
          admin: members ? groupData.admin : "",
          type: members ? "group" : "individual",
          name: members ? groupData.name : "",
        });

        socket.emit("sendMessage", {
          conversationId,
          senderId: user.id,
          message: messageOne,
          receiverId,
          date: currentDate.toISOString(),
          isReply: isReply,
          isForward: isForward,
          messageOnReply: replyData ? replyData.message : null,
          senderOnReply: replyData ? replyData.senderId : null,
          admin: members ? groupData.admin : "",
          type: members ? "group" : "individual",
          name: members ? groupData.name : "",
          read: false,
        });
        socket.emit("sendLastMessages", {
          conversationId,
          loggedUserId: loggedUser.id,
          lastMessages: [
            message || messages?.message,
            {
              loggedUserId: loggedUser.id,
              message: messageOne,
              receiverId,
              id: user.id,
              conversationId,
              date: currentDate.toISOString(),
              read: false,
            },
          ],
        });
        setMessage("");
      } else {
        console.error("Failed to send message:", res.statusText);
        // Handle the error as needed
      }
      setShowEmojiPicker(false);
      setIsReply(false);
      setIsForward(false);
      setSearchValue("");
    } catch (error) {}
  };

  const updateImg = async (id, formData) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/imgUpdate/${id}`, {
        method: "PATCH",
        body: formData, // Menggunakan FormData sebagai body request
      });

      // Periksa apakah respons berhasil
      if (!res.ok) {
        throw new Error("Failed to update image");
      }

      // Handle respons atau kembalikan sesuai kebutuhan
      const resData = await res.json();
      const currentDate = new Date();
      setPopUpForm(false);
      socket.emit(
        "sendConversations",
        Array.isArray(resData.data.conversationId)
          ? {
              conversationId: resData.data.conversationId,
              senderId: resData.data.user.id,
              receiverId: resData.data.receiverId,
              message: resData.data.messages,
              date: currentDate.toISOString(),
              type: resData.data.type,
              name: "",
              img: resData.data.user.img,
              userId: resData.data.user,
            }
          : {
              conversationId: resData.data.conversationId,
              senderId: resData.data.admin,
              receiverId: resData.data.members,
              message:
                messages && messages.length
                  ? messages[messages.length - 1]
                  : null,
              date:
                messages && messages.length
                  ? messages[messages.length - 1].date
                  : currentDate.toISOString(),
              admin: resData.data.admin,
              type: resData.data.type,
              name: resData.data.name,
              img: resData.data.img,
            }
      );
      return resData;
    } catch (error) {
      console.error("Error updating image:", error);
      // Handle error sesuai kebutuhan, misalnya dengan menampilkan pesan error kepada pengguna
      throw error;
    }
  };

  useEffect(() => {
    return () => {
      setConversations([]);
      setLastMessages([]);
      // Membersihkan state atau melakukan tindakan lain sesuai kebutuhan
    };
  }, []);
  const formatTime = (timestamp) => {
    if (timestamp) {
      const date = new Date(timestamp);
      const utc = date.getTime() + date.getTimezoneOffset() * 60000; // Convert to UTC
      const gmt7 = new Date(utc + 3600000 * 7); // Adjust for GMT+7

      const hours = gmt7.getHours().toString().padStart(2, "0");
      const minutes = gmt7.getMinutes().toString().padStart(2, "0");

      return `${hours}:${minutes}`;
    } else {
      return "";
    }
  };

  const handleEmoticonClick = (messageId) => {
    setShowReply(true);
    // You can perform additional actions here if needed
  };

  const notifyDashboard = (value) => {
    setIsCopied(value);
  };

  const replyNotifiy = (value, senderId, namaSender, message, messageId) => {
    setIsReply(value);
    const sender = users.find((user) => user?.user?.id === senderId);
    setReplyData({
      senderId: sender
        ? { nama: sender.user.fullName, id: sender.user.id }
        : { nama: namaSender, id: senderId },
      message: message,
      messageId: messageId,
    });
  };

  const deleteNotify = async (messageId) => {
    try {
      const response = await fetch(
        ` http://127.0.0.1:8000/api/message/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      setMessages((prevMessages) => {
        // Pastikan prevMessages adalah array sebelum mencoba memfilternya
        if (!Array.isArray(prevMessages)) {
          return prevMessages;
        }

        // Tambahkan pesan yang dihapus ke dalam state lokal dengan properti tambahan
        return [
          ...prevMessages.filter((message) => message.id !== messageId),
          {
            id: messageId,
            text: "This message has been deleted",
            deleted: true,
          },
        ];
      });
      const data = await response.json();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  function filterUsersAndMessages(users, conversationMessage, searchValue) {
    // Filter users berdasarkan email atau fullName
    const filteredUsers = users.filter(
      (user) =>
        user.user?.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.user?.fullName?.toLowerCase().includes(searchValue.toLowerCase())
    );
    const filteredMessages = Object.values(conversationMessage)
      .flatMap((conversation) => {
        // Tambahkan pemeriksaan untuk memastikan bahwa conversation.messages ada dan merupakan array
        if (Array.isArray(conversation.messages)) {
          return conversation.messages.map((message) => ({
            message,
            user: conversation.user || conversation.members,
            conversationName: conversation.name ? conversation.name : null,
          }));
        }

        // Jika conversation.messages tidak ada atau bukan array, kembalikan array kosong
        return [];
      })
      .filter(({ message }) =>
        message?.message?.toLowerCase()?.includes(searchValue.toLowerCase())
      );

    return { filteredMessages, filteredUsers };
  }

  const { filteredMessages, filteredUsers } = filterUsersAndMessages(
    users,
    conversations,
    searchValue
  );

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleCloseReply = () => {
    setShowReply(false);
  };

  const handleForwardButtonClick = (value) => {
    setShowForward(value);
  };

  const handleEmojiSelect = (selectedEmoji) => {
    // Update the message state with the selected emoji
    setMessage((prevMessage) => prevMessage + selectedEmoji);
  };

  const handleToggleExpand = (index) => {
    const newExpandedMessages = [...expandedMessages];
    newExpandedMessages[index] = !newExpandedMessages[index];
    setExpandedMessages(newExpandedMessages);
  };

  const mappingConversation = (conversationId) => {
    conversations.map((conversation) => {
      const conversationCheck = conversation.conversationId === conversationId;
      if (conversationCheck) {
        return {
          members: conversation.members,
        };
      }
    });
  };

  const getRandomColor = () => {
    // Generate random RGB values
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    // Convert RGB to hexadecimal
    const color = "#" + r.toString(16) + g.toString(16) + b.toString(16);
    return color;
  };

  const popUpFrom = (value) => {
    setPopUpForm(value);
  };

  return (
    <div className="w-screen flex">
      <div
        className={`${
          userInConversation && window.innerWidth < 1024 ? "hidden" : "w-[100%]"
        } lg:w-[25%] h-screen bg-secondary overflow-scroll border-r-[1px] border-[#e1dfda]`}
      >
        {popUpForm && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Menghentikan perilaku bawaan pengiriman formulir

                // Membuat objek FormData
                const formData = new FormData();
                formData.append("img", e.target.imgUpload.files[0]); // Mengambil file dari input file

                // Panggil fungsi updateImg dengan formData sebagai argumen
                updateImg(
                  groupData.conversationId
                    ? groupData.conversationId
                    : loggedUser.id,
                  formData
                );
              }}
            >
              <div className="mb-6 w-[75%]">
                <label
                  htmlFor="imgUpload"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Upload Image
                </label>
                <input
                  type="file"
                  id="imgUpload"
                  name="imgUpload" // Tambahkan name agar dapat diakses dalam FormData
                  className="border border-gray-300 rounded p-2 w-full"
                  accept="image/*" // Hanya menerima file gambar
                />
              </div>
              <button
                type="submit"
                className={`text-white bg-primary hover:bg-primary focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-[75%] px-5 py-2.5 text-center `}
              >
                Send
              </button>
            </form>
          </div>
        )}
        <div className="flex items-center flex-row pt-4 pb-2 ">
          <div className="mx-6 flex items-center w-full justify-between relative">
            <h3 className="text-2xl font-semibold">Chats</h3>
            {/* <MenuButton onClick={() => setMenuClick(true)} />
            <MenuProfile
              className={"absolute top-10 right-0 z-[10]"}
              popUpForm={popUpFrom}
            /> */}
          </div>
        </div>

        <div className="flex items-center justify-center flex-col">
          <Search
            className="w-[100%] px-6 pt-2 pb-4"
            placeholder="Search or start a new chat"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          {/* <div className="w-[80%] p-3 bg-red-400 rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer transition duration-100">
              hloo
            </div>
            <div className="flex items-center justify-between px-3 py-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer transition duration-100">
              hloo
            </div>
            <div className="flex items-center justify-between px-3 py-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer transition duration-100">
              asd
            </div>
          </div> */}
        </div>
        <div className="mx-4 mt-2">
          <div>
            {searchValue ? (
              <div>
                {/* Tampilkan filteredMessages dan filteredUsers */}
                {filteredMessages.map(
                  ({ message, user, conversationName }, index) => {
                    // Ensure messageId exists and is not null
                    const messageId = message.messageId || `message_${index}`; // Fallback to an index-based ID if messageId is not available

                    const messageDate = new Date(message.date);
                    const today = new Date();
                    const isToday =
                      messageDate.getDate() === today.getDate() &&
                      messageDate.getMonth() === today.getMonth() &&
                      messageDate.getFullYear() === today.getFullYear();

                    let formattedDate = "";
                    if (isToday) {
                      // Jika pesan diterima hari ini, tampilkan jam
                      const hours = messageDate.getHours();
                      const minutes = messageDate.getMinutes();
                      const formattedHours = hours < 10 ? "0" + hours : hours;
                      const formattedMinutes =
                        minutes < 10 ? "0" + minutes : minutes;
                      formattedDate = `${formattedHours}:${formattedMinutes}`;
                    } else {
                      // Jika pesan diterima pada tanggal lain, tampilkan tanggal, bulan, dan tahun
                      const day =
                        messageDate.getDate() < 10
                          ? "0" + messageDate.getDate()
                          : messageDate.getDate();
                      const month =
                        messageDate.getMonth() + 1 < 10
                          ? "0" + (messageDate.getMonth() + 1)
                          : messageDate.getMonth() + 1;
                      const year = messageDate.getFullYear();
                      formattedDate = `${day}/${month}/${year}`;
                    }

                    return (
                      <div
                        className={`${message.messageId} overflow-hidden bg-[#e6e6e6] mt-2 rounded-md h-16 items-center py-2 hover:bg-[#e6e6e6] hover:rounded-md p-2 cursor-pointer border-black transition duration-100 `}
                        key={index}
                        onClick={() => {
                          handleNewOrNoConcersation(user, message);
                        }}
                      >
                        <div className="flex flex-row justify-between">
                          {conversationName ? "" : ""}
                          <p className="font-semibold truncate text-wrap overflow-hidden">
                            {user?.fullName || user?.email || conversationName}
                          </p>
                          <p className="font-lg">{formattedDate}</p>
                        </div>
                        <p>{message.message}</p>
                      </div>
                    );
                  }
                )}
                {filteredUsers.map((user, index) => (
                  <div
                    onClick={() => handleNewOrNoConcersation(user.user)}
                    className="overflow-hidden mt-2 bg-[#e6e6e6] rounded-md h-16 items-center py-2 hover:bg-[#e6e6e6] hover:rounded-md p-2 cursor-pointer mb-2 transition duration-100"
                    key={index}
                  >
                    {" "}
                    {user.user.email}
                  </div>
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations
                .filter(
                  (conversation) =>
                    (conversation.messages &&
                      Array.isArray(conversation.messages) &&
                      conversation.messages.length > 0) ||
                    conversation.type === "group"
                )

                .sort((a, b) => {
                  const lastMessageA = a.messages[a.messages.length - 1];
                  const lastMessageB = b.messages[b.messages.length - 1];

                  const dateA = lastMessageA
                    ? new Date(lastMessageA.date)
                    : new Date(a.date);
                  const dateB = lastMessageB
                    ? new Date(lastMessageB.date)
                    : new Date(b.date);
                  return dateB - dateA;
                })
                .map((conversation, index) => {
                  const lastMessage = conversation.messages
                    ? conversation.messages[conversation.messages.length - 1]
                    : null;
                  const isRead = lastMessage ? lastMessage.read : false;

                  const rillLastMessages = conversations.reduce(
                    (acc, conversation) => {
                      // Mendapatkan pesan terakhir dari setiap percakapan
                      const lastMessage = conversation.messages
                        ? conversation.messages[
                            conversation.messages.length - 1
                          ]
                        : null;

                      if (lastMessage) {
                        // Menyimpan pesan terakhir ke dalam objek dengan kunci conversationId
                        acc[conversation.conversationId] = lastMessage.message;
                      }

                      return acc;
                    },
                    {}
                  );

                  return (
                    <div
                      key={conversation.conversationId}
                      className={`py-2 hover:bg-[#e6e6e6] hover:rounded-md p-2 cursor-pointer mb-2 transition duration-100 ${
                        conversation.conversationId === currentConversationId
                          ? "bg-[#e6e6e6] rounded-md"
                          : "bg-secondary rounded-md"
                      } overflow-hidden`}
                    >
                      <div
                        className="cursor-pointer flex items-center"
                        onClick={() => {
                          fetchMessages(
                            conversation.conversationId,
                            conversation.user || conversation.members,
                            "",
                            conversation.type,
                            conversation.name,
                            conversation.admin
                          );
                          setCurrentConversationId(conversation.conversationId);
                        }}
                      >
                        <img
                          src={`http://127.0.0.1:8000/${
                            conversation.user?.img || conversation?.img
                          }`}
                          className="w-12 h-12 rounded-full border border-primary flex-shrink-0"
                          alt="Profile"
                        />
                        <div className="ml-6 overflow-hidden flex-grow">
                          <div className="flex flex-row justify-between items-center">
                            <h3 className="text-lg font-semibold">
                              {conversation.user?.fullName ||
                                conversation.name ||
                                conversation.conversationId}
                            </h3>
                            <div
                              key={conversation.conversationId}
                              className="justify-end"
                            >
                              <p className="font-thin font-lg">
                                {formatTime(
                                  conversation.messages[
                                    conversation.messages.length - 1
                                  ]?.date || conversation.date
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start ">
                            <div className="flex-shrink-0 mr-1">
                              {conversation.messages &&
                              conversation.messages.length > 0 ? (
                                isRead ? (
                                  // Display the second icon when read is true
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-checks mt-[6.5px]"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="#2c3e50"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />

                                    <path d="M7 12l5 5l10 -10" />
                                    <path d="M2 12l5 5m5 -5l5 -5" />
                                  </svg>
                                ) : (
                                  // Display the first icon when read is false
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-check mt-[6.5px]"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <path d="M5 12l5 5l10 -10" />
                                  </svg>
                                )
                              ) : (
                                ""
                              )}
                            </div>
                            {lastMessages?.conversationId ===
                            conversation?.conversationId ? (
                              <div className="overflow-hidden">
                                <p
                                  className="overflow-hidden"
                                  style={{
                                    overflowWrap: "break-word",
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 1,
                                    minHeight: "1em",
                                  }}
                                >
                                  {lastMessage.message}
                                </p>
                              </div>
                            ) : (
                              <div className="overflow-hidden">
                                {conversation.messages &&
                                  Array.isArray(conversation.messages) &&
                                  conversation.messages.length > 0 && (
                                    <p
                                      className="overflow-hidden"
                                      style={{
                                        overflowWrap: "break-word",
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitBoxOrient: "vertical",
                                        WebkitLineClamp: 1,
                                        minHeight: "1em",
                                      }}
                                    >
                                      {lastMessage.message}
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No conversation
              </div>
            )}
          </div>
        </div>
        <NewChatButton users={users} userLogin={user} socket={socket} />
      </div>

      <div
        className={` ${
          userInConversation && window.innerWidth < 1024
            ? "w-[100%] "
            : "w-[100%] "
        } md:w-[100%] lg:flex h-screen bg-white flex-col`}
      >
        {userInConversation && (
          <div
            className="w-[100%] bg-secondary flex items-center px-7 py-2 border-b-[1px] border-[#e1dfda] drop-shadow-[0_4px_3px_rgba(0,0,0,0.1)]"
            ref={chatContainerRef}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-arrow-left mr-[10px]"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={() => {
                setUserInConversation((prevValue) => !prevValue); // Memperbarui nilai userInConversation
                setImageClick(!imgClick); // Memperbarui nilai imgClick
                socket.emit("sendActiveUser", {
                  aktif: false,
                  loggedUser: loggedUser.id,
                  conversationId: currentConversationId,
                });

                conversations.forEach((conversation, index) => {
                  socket.emit("sendLastMessages", {
                    loggedUserId: loggedUser.id,
                    date: message.date,
                    read: message.read,
                    conversationId: currentConversationId,
                    receiverId: messages.receiverId,
                    lastMessages: conversation.messages,
                  });
                });
              }}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>
            <div className="relative">
              <img
                src={`http://127.0.0.1:8000/${
                  messages?.receiver?.img ||
                  conversations.find(
                    (conversation) =>
                      conversation.conversationId === currentConversationId
                  )?.img ||
                  "default.jpg" // Ganti 'default.jpg' dengan nama file gambar default jika tidak ditemukan
                }`}
                className={`w-12 h-12 relative rounded-full border border-primary flex-shrink-0 cursor-pointer
                }`}
                alt="Profile"
                onClick={() => setImageClick(!imgClick)}
              />
              {/* <ViewProfileGroub /> */}
              <div
                className={`transition-all duration-300 ${
                  imgClick ? "top-14" : "top-0"
                } absolute left-0`}
              >
                {groupData && imgClick && (
                  <ViewProfileGroub
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    users={users}
                    loggedId={user}
                    groupData={groupData}
                    fetchMessages={fetchMessages}
                    socket={socket}
                    fetchMessagess={fetchMessages}
                  />
                )}
              </div>
            </div>

            {messages?.receiver ? (
              <div className="ml-4 mr-auto">
                <h3 className="text-lg font-medium">
                  {messages?.receiver.fullName}
                </h3>
                <p className="text-sm font-thin text-gray-600">
                  {messages?.receiver.email}
                </p>
              </div>
            ) : (
              <div className="ml-4 mr-auto">
                <h3 className="text-lg font-medium">{groupData.name}</h3>
                <p className="text-sm font-thin text-gray-600">
                  {Array.isArray(groupData.members) &&
                    groupData?.members
                      ?.map((memberId) => {
                        const userGroup = users.find(
                          (user) => user.user.id === memberId
                        );
                        const admin = user.id === memberId;
                        if (admin) {
                          return "You";
                        } else if (userGroup) {
                          return userGroup.user.fullName;
                        } else {
                          return memberId;
                        }
                      })
                      .join(", ")}
                </p>
              </div>
            )}

            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-phone-outgoing"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <path d="M15 9l5 -5" />
                <path d="M16 4l4 0l0 4" />
              </svg>
            </div>
          </div>
        )}

        {userInConversation ? (
          <div className="h-[75%] w-full overflow-scroll shadow-sm">
            <div className="p-14">
              {(messages?.message && messages?.message.length > 0
                ? messages?.message
                : messages
              )?.length > 0 ? (
                (messages?.message && messages?.message.length > 0
                  ? messages?.message
                  : messages
                ).map((messageObj, index) => {
                  const senderId =
                    (messageObj.message?.loggedUserId ?? messageObj.id) ===
                    loggedUser.id;
                  const messageDate = new Date(
                    messageObj?.message?.date ||
                      messageObj?.date ||
                      messageObj?.createdAt ||
                      messageObj?.message?.createdAt
                  );
                  const senderIdGroup = users.find(
                    (user) =>
                      user.user.id ===
                      (messageObj.message?.loggedUserId || messageObj.id)
                  );
                  const hours = messageDate.getHours();
                  const minutes = messageDate.getMinutes();
                  const formattedMinutes =
                    minutes < 10 ? `0${minutes}` : minutes;
                  const randomColor = getRandomColor();
                  return (
                    <div className="static" key={index}>
                      <div
                        className={`flex ${
                          senderId ? "flex-row-reverse" : "flex-row"
                        } items-center`}
                      >
                        <div
                          className={`max-w-[45%] rounded-b-xl px-4 py-3 mt-6 shadow-sm break-all ${
                            senderId
                              ? "bg-[#1d3630] rounded-tl-xl text-[#f7f4ee]"
                              : "bg-secondary rounded-tr-xl text-[#06140e]"
                          }`}
                          id={`${
                            messageObj.message.messageId || messageObj.messageId
                          }`}
                        >
                          {(messageObj.message.isForward ||
                            message.isForward) && (
                            <div className="flex flex-row items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-arrow-forward-up"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="#9CA3AF"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path
                                  stroke="none"
                                  d="M0 0h24v24H0z"
                                  fill="none"
                                />
                                <path d="M15 14l4 -4l-4 -4" />
                                <path d="M19 10h-11a4 4 0 1 0 0 8h1" />
                              </svg>
                              <p className="font-light italic text-xs text-gray-400">
                                Forwarded
                              </p>
                            </div>
                          )}
                          <p
                            className={`font-semibold text-blue-500  ${
                              messageObj.message.isReply || messageObj.isReply
                                ? "mt-2"
                                : "mt-0"
                            }`}
                          >
                            {senderIdGroup?.user.fullName}
                          </p>

                          {(messageObj.message.isReply ||
                            messageObj.isReply) && (
                            <div className="w-full bg-[#e1dfda] border-[#e1dfda] border-t-[1px] rounded-md">
                              <div
                                className={`bg-[#e6e6e6] p-[6px] border rounded-md border-[#e1dfda] drop-shadow-[0_4px_3px_rgba(0,0,0,0.13)] `}
                              >
                                <p className=" font-semibold text-sm text-[#1e6554]">
                                  {messageObj.message.senderOnReply?.id ===
                                  loggedUser.id
                                    ? "You"
                                    : messageObj.message.senderOnReply?.nama ||
                                      messageObj.senderOnReply?.nama}
                                </p>
                                <p
                                  className=" text-gray-900 text-[10px] overflow-hidden"
                                  style={{
                                    overflowWrap: "break-word",
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 1,
                                    minHeight: "1em",
                                  }}
                                >
                                  {messageObj.message.messageOnReply ||
                                    messageObj.messageOnReply}
                                </p>
                              </div>
                            </div>
                          )}

                          <p
                            className={`text-sm rounded-md px-1  ${
                              messageObj.message.isReply || messageObj.isReply
                                ? "mt-2"
                                : "mt-0"
                            }`}
                          >
                            {expandedMessages[index]
                              ? messageObj.message.message || messageObj.message
                              : `${(
                                  messageObj.message.message ||
                                  messageObj.message
                                ).slice(0, 200)}`}
                          </p>
                          {(messageObj.message.message || messageObj.message)
                            .length > 200 && (
                            <button
                              onClick={() => handleToggleExpand(index)}
                              className={`text-blue-500 cursor-pointer focus:outline-none transition-max-height duration-300 ease-in-out overflow-hidden ${
                                expandedMessages[index]
                                  ? "max-h-full"
                                  : "max-h-8"
                              }`}
                            >
                              {expandedMessages[index]
                                ? "Show Less"
                                : "...Show More"}
                            </button>
                          )}

                          <div className="flex flex-row justify-end">
                            <span
                              className={`text-xs mt-2 ${
                                senderId ? "text-white-500" : "text-gray-500"
                              }`}
                            >
                              {`${hours}:${formattedMinutes}`}
                            </span>
                            {senderId && (
                              <div>
                                {messageObj.message.read || messageObj.read ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-checks mt-2"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="blue"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <path d="M7 12l5 5l10 -10" />
                                    <path d="M2 12l5 5m5 -5l5 -5" />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-check mt-[6.5px]"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <path d="M5 12l5 5l10 -10" />
                                  </svg>
                                )}
                              </div>
                            )}
                            {/* <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-checks mt-2"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="blue"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />

                                    <path d="M7 12l5 5l10 -10" />
                                    <path d="M2 12l5 5m5 -5l5 -5" />
                                  </svg> */}
                          </div>
                        </div>
                        <div className="relative">
                          <Emoticon
                            onClick={(event) => {
                              handleEmoticonClicks(
                                event,
                                messageObj.message.messageId ||
                                  messageObj.messageId
                              );
                              handleEmoticonClick(
                                messageObj.message.messageId ||
                                  messageObj.messageId
                              );
                              setShowReplyForMessageId(
                                messageObj.message.messageId ||
                                  messageObj.messageId
                              );
                            }}
                            ref={emoticonRef}
                            className={senderId ? "mr-2" : "ml-2"}
                          />
                          <div
                            className={`transition-all duration-500 transform ${
                              showReplyForMessageId ===
                                (messageObj.message.messageId ||
                                  messageObj.messageId) && showReply
                                ? "translate-y-0 opacity-100"
                                : "translate-y-10 opacity-0"
                            } absolute bottom-0 left-0`}
                          >
                            {/* {showForward && (
                              <Forward
                                className={"absolute right-[10px]"}
                                userList={users}
                                listCheck={listCheck}
                              />
                            )} */}
                            {showReplyForMessageId ===
                              (messageObj.message.messageId ||
                                messageObj.messageId) &&
                              showReply && (
                                <Reply
                                  messageId={showReplyForMessageId}
                                  message={
                                    messageObj.message.message ||
                                    messageObj.message
                                  }
                                  senderId={
                                    messageObj.message.id || messageObj.id
                                  }
                                  nama={
                                    (messageObj.message.id || messageObj.id) ===
                                      loggedUser.id && !messageObj.receiver
                                      ? {
                                          nama: loggedUser.fullName,
                                          id: loggedUser.id,
                                        }
                                      : messages.receiver
                                      ? {
                                          nama: messages.receiver?.fullName,
                                          id: messages.receiver?.id,
                                        }
                                      : {
                                          nama: "habib",
                                          id: messageObj.message.id,
                                        }
                                  }
                                  notifyDashboard={notifyDashboard}
                                  replyNotifiy={replyNotifiy}
                                  deleteNotify={deleteNotify}
                                  className={`absolute ${
                                    senderId ? "right-[-20px]" : "left-[10px]"
                                  } ${
                                    replyPosition.top > 300 &&
                                    replyPosition.top < 523
                                      ? "bottom-8"
                                      : "top-1"
                                  }`}
                                  ref={(ref) =>
                                    (replyRef.current[
                                      messageObj.message.messageId ||
                                        messageObj.messageId
                                    ] = ref)
                                  }
                                  onCloseReply={handleCloseReply}
                                  onShowForward={handleForwardButtonClick}
                                />
                              )}
                          </div>
                        </div>
                      </div>
                      <div ref={messageRef}></div>
                    </div>
                  );
                })
              ) : (
                // Tampilkan div "No messages" jika `messages` kosong atau tidak ada
                <div className="justify-center text-center text-lg font-semibold">
                  No Messages
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-lg font-semibold">No Conversation Active</div>
          </div>
        )}

        {/* {showForward && (
          <Forward
            className={"absolute right-[10px]"}
            userList={users}
            listCheck={listCheck}
            messageId={showReplyForMessageId}
            message={message}
            sendMessageForward={sendMessageForward}
            onCloseReply={handleCloseReply}
          />
        )} */}
        {isReply && (
          <div className="w-[75%]  pr-4 pl-14 absolute bottom-[100px] pt-4 bg-[#e1dfda] border-[#e1dfda] border-t-[1px] rounded-tl-md rounded-tr-md transition-all duration-500 transform translate-y-0 opacity-100 ">
            <div className="bg-[#e6e6e6] p-[6px] border rounded-md border-[#e1dfda] drop-shadow-[0_4px_3px_rgba(0,0,0,0.13)] flex items-center justify-between ">
              <div>
                <p className=" ml-1 font-semibold text-base text-[#1e6554]">
                  {replyData.senderId.nama}
                </p>
                <p className="ml-1 text-gray-900 text-sm">
                  {replyData.message}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-square-rounded-x mr-2"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => setIsReply(false)}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 10l4 4m0 -4l-4 4" />
                <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
              </svg>
            </div>
          </div>
        )}
        {userInConversation && (
          <div
            className={`absolute pr-14 pl-14 pb-8 pt-4 ${
              userInConversation ? "w-full lg:w-[80%]" : ""
            }  flex items-center bg-[#e1dfda] bottom-0`}
          >
            {/* <div
            className={`transition-opacity opacity-100 scale-y-100 transform-gpu ease-in-out duration-300 ${
              showReply ? "opacity-100" : "opacity-0"
            }`}
          ></div> */}

            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-[100%]"
              inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
              onEmojiSelect={handleEmojiSelect}
              showEmojiPicker={showEmojiPicker}
              toggleEmojiPicker={toggleEmojiPicker}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessages();
                }
              }}
            />

            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessages()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div className="ml-4 p-2 cursor-pointer bg-light rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* <div className="w-[25%] bg-secondary h-screen px-4 py-10 overflow-scroll">
        <div className="text-primary text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.map((user, index) => (
              <div
                className="flex items-center py-5 border-b border-b-gray-500"
                key={index}
              >
                <div
                  className="cursor-pointer flex items-center"
                  onClick={() => handleNewOrNoConcersation(user.user)}
                >
                  <div>
                    <img
                      src={`http://127.0.0.1:8000/${user.user.img}`}
                      className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      alt="Profile"
                    />
                  </div>

                  <div className="ml-6">
                    <h3 className="text-lg font-semibold">
                      {user.user.fullName}
                    </h3>
                    <p className="text-sm font-light text-gray-600">
                      {user.user.email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No People
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
