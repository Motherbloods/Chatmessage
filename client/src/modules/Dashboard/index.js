import React, { useEffect, useRef, useState, useCallback } from "react";
import Input from "../../components/Input";
import { io } from "socket.io-client";
import Emoticon from "../../components/Emoticon";
import Reply from "../../components/Reply";
import Search from "../../components/Search";
import Forward from "../../components/Forward";
import "../../index.css";

const Dashboard = () => {
  const currentConversationIdRef = useRef(null);
  const emoticonRef = useRef(null);
  const replyRef = useRef({});
  const chatContainerRef = useRef(null);
  const messageRef = useRef(null);
  const messageIdRef = useRef(null);
  const [replyPosition, setReplyPosition] = useState({ top: 0, left: 0 });
  const loggedUser = JSON.parse(localStorage.getItem("user:detail"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [userInConversation, setUserInConversation] = useState(false);
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
  const [replyData, setReplyData] = useState({
    senderId: "",
    message: "",
    messageId: "",
  });

  useEffect(() => {
    // Update ref when state changes
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    const socketInstance = io("https://chatmessage-client.vercel.app", {
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

    // // Mengambil elemen target (dalam kasus ini, emoticon yang diklik)
    // const targetElement = event.target;

    // // Menggunakan getBoundingClientRect() untuk mendapatkan posisi relatif terhadap viewport
    // const boundingRect = targetElement.getBoundingClientRect();

    // // Menghitung posisi relatif terhadap parent element (dalam hal ini, container div)
    // const relativeX = clientX - boundingRect.left;
    // const relativeY = clientY - boundingRect.top;

    // console.log("Posisi X relatif:", relativeX);
    // console.log("Posisi Y relatif:", relativeY);
    // Lakukan operasi lain sesuai kebutuhan Anda
  };

  const conversationIdsSet = new Set(
    conversations.map((conversation) => conversation.conversationId)
  );

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("addUser", user.id);
      socket.on("getUsers", (users) => {});

      socket.on("getMessage", (data) => {
        const conversationIdObject = { conversationId: data.conversationId };
        if (
          currentConversationIdRef.current &&
          (typeof currentConversationIdRef.current === "object"
            ? data.conversationId ===
              currentConversationIdRef.current.conversationId
            : data.conversationId === currentConversationIdRef.current)
        ) {
          setMessages((prev) => {
            const messagesArray = prev.message || [];
            const updatedMessages = [
              ...messagesArray,
              {
                id: data.id,
                message: data.message,
                date: data.date,
                isReply: data.isReply,
                messageOnReply: data.messageOnReply,
                senderOnReply: data.senderOnReply,
                isForward: data.isForward,
              },
            ];
            setConversations((prevConversations) => {
              // Find the conversation that needs to be updated
              return prevConversations.map((conversation) =>
                conversation.conversationId === data.conversationId
                  ? {
                      ...conversation,
                      messages: updatedMessages,
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
      });

      socket.on("getConversations", (data) => {
        if (!conversationIdsSet.has(data.conversationId)) {
          // Tambahkan percakapan hanya jika ID percakapan belum ada
          setConversations((prev) => {
            // Cek apakah percakapan sudah ada dalam state
            const existingConversation = prev.find(
              (conv) => conv.conversationId === data.conversationId
            );

            if (existingConversation) {
              // Jika sudah ada, kembalikan state tanpa perubahan
              return prev;
            }

            // Jika belum ada, tambahkan percakapan baru
            conversationIdsSet.add(data.conversationId); // Tambahkan ID ke Set
            return [...prev, data];
          });
        }
      });
      socket.on("getLastMessage", (data) => {
        const { lastMessage } = data;
        setLastMessages(lastMessage);
      });

      // Membersihkan event listener pada unmount komponen
      return () => {
        socket.off("getLastMessage");
      };
    }
  }, [socket, user.id, messages.message?.id]);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.message]);

  useEffect(() => {
    if (messageIdRef.current) {
      messageIdRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.message]);

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
          `https://chatmessage-server.vercel.app/conversations/${loggedUser.id}`,
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

            const { conversationId, messages } = conversation;
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
        const res = await fetch(
          `https://chatmessage-server.vercel.app/users/${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
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
    const targetConversation = conversations.find(
      (conv) => conv.user.id === userId.id
    );
    if (forward) {
      fetchMessages(
        targetConversation ? targetConversation.conversationId : "new",
        userId,
        message,
        true
      );
    } else {
      fetchMessages(
        targetConversation ? targetConversation.conversationId : "new",
        userId
      );
    }
  };

  const fetchMessages = async (conversationId, user, message, forward) => {
    try {
      let url = `https://chatmessage-server.vercel.app/messages/${conversationId}?receiverId=${user.id}&senderId=${loggedUser.id}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resData = await res.json();
      if (conversationId === "new") {
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
          setLastMessages(lastMessage);
          // if (lastMessage.id === loggedUser.id) {
          // Jika id pengirim (sender) sama dengan loggeduser.id
          socket.emit("sendLastMessages", {
            loggedUserId: loggedUser.id,
            messageId,
            date: messages.date,
            read: messages.read,
            receiverId: messages.receiverId,
            conversationId: newConversationId,
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
            lastMessages: [lastMessage],
          });
          socket.emit("sendActiveUser", {
            aktif: true,
            loggedUser: loggedUser.id,
            conversationId,
          });
        } else {
          // Handle the case where resData.messagesData is undefined or null
          console.error("Error: messagesData is undefined or null");
        }
        setMessages({
          message: resData.messagesData,
          receiver: user,
          conversationId,
        });
        setCurrentConversationId(conversationId);
        if (forward && message) {
          sendMessages(conversationId, user, message);
        }
      }
      setUserInConversation(true);
      setOnConversation(true);
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
      const body =
        conversationIdForward && userForward && messageforward
          ? JSON.stringify({
              conversationId: conversationIdForward,
              senderId: user.id,
              receiverId: userForward.id,
              message: messageforward,
              date: currentDate.toISOString(),
              isForward: true,
            })
          : !isReply
          ? JSON.stringify({
              conversationId: messages.conversationId,
              senderId: user.id,
              receiverId: messages.receiver.id,
              message,
              date: currentDate.toISOString(),
            })
          : JSON.stringify({
              conversationId: messages.conversationId,
              senderId: user.id,
              receiverId: messages.receiver.id,
              message,
              isReply: true,
              isReplyMessageId: replyData.messageId,
              date: currentDate.toISOString(),
            });
      const res = await fetch(
        `https://chatmessage-server.vercel.app/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: body,
        }
      );

      if (res.ok) {
        const conversationId = conversationIdForward || messages.conversationId;
        const receiverId = userForward ? userForward.id : messages.receiver.id;
        const messageOne = messageforward ? messageforward : message;
        // After successfully sending the message, emit sendConversations
        socket.emit("sendConversations", {
          conversationId,
          senderId: user.id,
          receiverId,
          message: messageOne,
          date: currentDate.toISOString(),
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
        });
        socket.emit("sendLastMessages", {
          conversationId,
          lastMessages: [
            message || messages.message,
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
    } catch (error) {
      console.log("erro in sendMessage", error);
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
    const date = new Date(timestamp);
    const utc = date.getTime() + date.getTimezoneOffset() * 60000; // Convert to UTC
    const gmt7 = new Date(utc + 3600000 * 7); // Adjust for GMT+7

    const hours = gmt7.getHours().toString().padStart(2, "0");
    const minutes = gmt7.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const handleEmoticonClick = (messageId) => {
    setShowReply(true);
    // You can perform additional actions here if needed
  };

  const notifyDashboard = (value) => {
    setIsCopied(value);
  };

  const replyNotifiy = (value, senderId, message, messageId) => {
    setIsReply(value);
    setReplyData({
      senderId: senderId,
      message: message,
      messageId: messageId,
    });
  };

  const deleteNotify = async (messageId) => {
    try {
      const response = await fetch(
        `https://chatmessage-server.vercel.app/message/${messageId}`,
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
        user.user.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.user.fullName?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const filteredMessages = Object.values(conversationMessage)
      .flatMap((conversation) =>
        conversation.messages.map((message) => ({
          message,
          user: conversation.user,
        }))
      )
      .filter(({ message }) =>
        message.message.toLowerCase().includes(searchValue.toLowerCase())
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

  const listCheck = (value) => {
    // console.log("ini value", value);
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

  const sendMessageForward = (receiver, message) => {
    if (receiver.length == 1) {
      handleNewOrNoConcersation(receiver[0], message, true);
      setIsForward(true);
    }
  };

  return (
    <div className="w-screen flex">
      <div
        className={`${
          userInConversation && window.innerWidth < 1024 ? "hidden" : "w-[100%]"
        } lg:w-[25%] h-screen bg-secondary overflow-scroll border-r-[1px] border-[#e1dfda]`}
      >
        <div className="flex items-center pt-4 pb-2 ">
          <div className="ml-6">
            <h3 className="text-2xl font-semibold">Chats</h3>
          </div>
        </div>
        <div className="flex items-center justify-center flex-col">
          <Search
            className="w-[100%] px-6 pt-2 pb-4"
            placeholder="Search or start a new chat"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
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
                {filteredMessages.map(({ message, user }, index) => {
                  // Ensure messageId exists and is not null
                  const messageId = message.messageId || `message_${index}`; // Fallback to an index-based ID if messageId is not available
                  if (!messageIdRef.current) {
                    messageIdRef.current = {}; // Initialize if not already initialized
                  }
                  messageIdRef.current[index] = messageId;
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
                      ref={(ref) => {
                        if (index === filteredMessages.length - 1) {
                          // Assign the ref of the last message
                          messageIdRef.current = ref;
                        }
                      }}
                      className={`${messageId} overflow-hidden bg-[#e6e6e6] mt-2 rounded-md h-16 items-center py-2 hover:bg-[#e6e6e6] hover:rounded-md p-2 cursor-pointer border-black transition duration-100 `}
                      key={index}
                    >
                      <div
                        className="flex flex-row justify-between"
                        onClick={() => handleNewOrNoConcersation(user)}
                      >
                        <p className="font-semibold truncate text-wrap overflow-hidden">
                          {user.fullName || user.email}
                        </p>
                        <p className="font-lg">{formattedDate}</p>
                      </div>
                      <p>{message.message}</p>
                    </div>
                  );
                })}
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
                    conversation.messages &&
                    Array.isArray(conversation.messages) &&
                    conversation.messages.length > 0
                )
                .map((conversation, index) => (
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
                          conversation.user
                        );
                        setCurrentConversationId(conversation.conversationId);
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="w-12 h-12 rounded-full border border-primary flex-shrink-0"
                        alt="Profile"
                      />
                      <div className="ml-6 overflow-hidden flex-grow">
                        <div className="flex flex-row justify-between items-center">
                          <h3 className="text-lg font-semibold">
                            {conversation.user.fullName ||
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
                            {lastMessages.read ? (
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
                            )}
                          </div>
                          {lastMessages &&
                          lastMessages.conversationId ===
                            conversation.conversationId ? (
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
                                {lastMessages.message}
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
                                    {
                                      conversation.messages[
                                        conversation.messages.length - 1
                                      ]?.message
                                    }
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No conversation
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={` ${
          userInConversation && window.innerWidth < 1024
            ? "w-[100%] "
            : "hidden w-0"
        } md:w-[100%] lg:flex h-screen bg-white flex-col`}
      >
        {userInConversation && messages.receiver && (
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
              onClick={() => setUserInConversation((prevValue) => !prevValue)}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12l14 0" />
              <path d="M5 12l6 6" />
              <path d="M5 12l6 -6" />
            </svg>

            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className="w-12 h-12 rounded-full border border-primary flex-shrink-0"
              alt="Profile"
            />

            <div className="ml-4 mr-auto">
              <h3 className="text-lg font-medium">
                {messages.receiver.fullName}
              </h3>
              <p className="text-sm font-thin text-gray-600">
                {messages.receiver.email}
              </p>
            </div>
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
              {messages.message && messages.message.length > 0 ? (
                messages.message.map(
                  (
                    {
                      id,
                      message,
                      date,
                      messageId,
                      isReply,
                      messageOnReply,
                      senderOnReply,
                      isForward,
                    },
                    index
                  ) => {
                    const senderId = id === loggedUser.id;
                    const messageDate = new Date(date);
                    const hours = messageDate.getHours();
                    // Get the minutes and format with leading zero if needed
                    const minutes = messageDate.getMinutes();
                    const formattedMinutes =
                      minutes < 10 ? `0${minutes}` : minutes;

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
                          >
                            {isForward && (
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
                            {isReply && (
                              <div className="w-full bg-[#e1dfda] border-[#e1dfda] border-t-[1px] rounded-md">
                                <div
                                  className={`bg-[#e6e6e6] p-[6px] border rounded-md border-[#e1dfda] drop-shadow-[0_4px_3px_rgba(0,0,0,0.13)] `}
                                >
                                  <p className="ml-1 font-semibold text-base text-[#1e6554]">
                                    {senderOnReply}
                                  </p>
                                  <p
                                    className="ml-1 text-gray-900 text-sm overflow-hidden"
                                    style={{
                                      overflowWrap: "break-word",
                                      overflow: "hidden",
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 1,
                                      minHeight: "1em",
                                    }}
                                  >
                                    {messageOnReply}
                                  </p>
                                </div>
                              </div>
                            )}
                            <p className={`${isReply ? "mt-2" : "mt-0"}`}>
                              {expandedMessages[index]
                                ? message
                                : `${message.slice(0, 200)}`}
                            </p>
                            {message.length > 200 && (
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

                            <div className="flex flex-row-reverse">
                              <span
                                className={`text-xs mt-2 ${
                                  senderId ? "text-white-500" : "text-gray-500"
                                }`}
                              >
                                {`${hours}:${formattedMinutes}`}
                              </span>
                              {senderId && (
                                <div>
                                  {lastMessages.read ? (
                                    // Display the second icon when read is true
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
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <Emoticon
                              onClick={(event) => {
                                handleEmoticonClicks(event, messageId);
                                handleEmoticonClick(messageId);
                                setShowReplyForMessageId(messageId);
                              }}
                              ref={emoticonRef}
                              className={senderId ? "mr-2" : "ml-2"}
                            />
                            <div
                              className={`transition-all duration-500 transform ${
                                showReplyForMessageId === messageId && showReply
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
                              {showReplyForMessageId === messageId &&
                                showReply && (
                                  <Reply
                                    messageId={showReplyForMessageId}
                                    message={message}
                                    senderId={id}
                                    nama={
                                      id === loggedUser.id
                                        ? loggedUser.fullName
                                        : messages.receiver?.fullName
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
                                      (replyRef.current[messageId] = ref)
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
                  }
                )
              ) : (
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
          <div className="w-full  pr-4 pl-14 pt-4 bg-[#e1dfda] border-[#e1dfda] border-t-[1px] rounded-tl-md rounded-tr-md transition-all duration-500 transform translate-y-0 opacity-100 ">
            <div className="bg-[#e6e6e6] p-[6px] border rounded-md border-[#e1dfda] drop-shadow-[0_4px_3px_rgba(0,0,0,0.13)] flex items-center justify-between ">
              <div>
                <p className=" ml-1 font-semibold text-base text-[#1e6554]">
                  {replyData.senderId}
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
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
