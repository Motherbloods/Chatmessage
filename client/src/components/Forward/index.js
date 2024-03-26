import React, { useState, useEffect, useRef } from "react";

const Forward = React.forwardRef(
  (
    {
      className,
      userList,
      listCheck,
      messageId,
      message,
      conversationId,
      sendMessageForward,
      onCloseReply,
      fetchMessages,
      sendMessages,
      conversations,
    },
    ref
  ) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);
    console.log("ini dsfsdf", containerRef);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target)
        ) {
          console.log("ini diluar");
          onCloseReply(); // Panggil fungsi onClose saat klik di luar area div
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onCloseReply]);

    const handleCheckboxChange = (userId, email, fullName) => {
      setSelectedItems((prevSelectedItems) => {
        const updatedSelectedItems = { ...prevSelectedItems };
        if (updatedSelectedItems[userId]) {
          // Jika item sudah ada dalam selectedItems
          if (!updatedSelectedItems[userId].checked) {
            // Jika checked adalah false (belum tercentang)
            delete updatedSelectedItems[userId]; // Hapus item
          } else {
            // Jika checked adalah true (sudah tercentang)
            updatedSelectedItems[userId].checked = false; // Set checked menjadi false
          }
        } else {
          // Jika item belum ada dalam selectedItems
          updatedSelectedItems[userId] = {
            id: userId,
            email: email,
            fullName: fullName,
            checked: true, // Set status tercentang menjadi true
          };
        }
        return updatedSelectedItems;
      });
    };

    const handleRemoveItemClick = (userId, email, fullName) => {
      setSelectedItems((prevSelectedItems) => {
        const updatedSelectedItems = { ...prevSelectedItems };
        // Menggunakan spread operator untuk menghapus properti userId dari objek
        const { [userId]: removedItem, ...restItems } = updatedSelectedItems;
        return restItems;
      });
    };

    const handleRemoveItemClickWithCheckbox = (userId, email, fullName) => {
      // Uncheck the corresponding checkbox
      handleRemoveItemClick(userId, email, fullName);
      const checkbox = document.getElementById(`checkbox-${userId}`);
      if (checkbox) {
        checkbox.checked = false;
      }
    };

    const filteredUsers = userList.filter((user) =>
      user.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedItemsDisplay = Object.keys(selectedItems)
      .filter(
        (userId) =>
          selectedItems[userId] &&
          userList.some((user) => user.user.id === userId)
      )
      .map((userId) => {
        const index = userList.findIndex((user) => user.user.id === userId);
        return (
          <div
            key={userId}
            email={userList[index]?.user.email}
            fullName={userList[index]?.user.fullName}
            className="bg-[#1daa61] text-gray-800 p-1 rounded mb-2 flex flex-row justify-between"
            style={{ boxShadow: "0 4px 3px rgba(255,255,255,0.06)" }}
          >
            {userList[index]?.user.email}
            {userList[index]?.user.fullName}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-square-rounded-x ml-2 cursor-pointer"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={(event) =>
                handleRemoveItemClickWithCheckbox(
                  userId,
                  userList[index]?.user.email,
                  userList[index]?.user.fullName,
                  event
                )
              }
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 10l4 4m0 -4l-4 4" />
              <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
            </svg>
          </div>
        );
      });

    useEffect(() => {
      // Call listCheck when selectedItemsDisplay changes
      listCheck(selectedItemsDisplay);
    }, [selectedItemsDisplay, listCheck]);

    const renderUser = (user) => (
      <div
        key={user.user.id}
        className="flex items-center justify-between px-3 py-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer transition duration-100"
        ref={containerRef}
      >
        <div>
          <h2>{user.user.email}</h2>
          <h2>{user.user.id}</h2>
        </div>
        <input
          type="checkbox"
          className="bg-black ml-2"
          id={`checkbox-${user.user.id}`}
          onChange={() =>
            handleCheckboxChange(
              user.user.id,
              user.user.email,
              user.user?.fullName
            )
          }
        />
      </div>
    );

    const selectedItemsForward = selectedItemsDisplay.map((item) => ({
      id: item.key,
      email: item.props.email,
      fullName: item.props.fullName,
    }));

    const sendMessageForwardButton = () => {
      sendMessageForward(selectedItemsForward, message);
    };

    // if (selectedItems.length === 1) {
    //   let targetConversation;
    //   if (conversations) {
    //     targetConversation = conversations.find(
    //       (conv) => conv.user.id === selectedItems[0].id
    //     );
    //   }

    //   if (targetConversation) {
    //     await fetchMessages(
    //       targetConversation.conversationId,
    //       selectedItems[0]
    //     );
    //   } else {
    //     await fetchMessages("new", selectedItems[0]);
    //   }
    //   await sendMessages();
    // }

    // Memastikan fetchMessages selesai sebelum sendMessages dipanggil

    return (
      <div
        className={`bg-[#333333] w-72 border rounded-md p-2 shadow-lg text-white ${className}`}
      >
        <div
          className={`flex px-2 cursor-pointer transition duration-100 flex-col py-2 `}
          style={{ overflowY: "auto", minHeight: "400px", maxHeight: "500px" }}
        >
          <h2 className="text-xl mb-2">Forward to..</h2>
          <div className="flex flex-wrap">{selectedItemsDisplay}</div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border-[1.1px] bg-[#e1dfda] drop-shadow-md focus:drop-shadow-[0_4px_3px_rgba(236,236,236,0.15)] focus:bg-gray-50 border-[#ececec]  text-gray-900 text-sm rounded-md  block w-full p-2.5 pl-8 mb-4 outline-none transition-all duration-300 ease-in-out `}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2 top-[22px] transform -translate-y-1/2 icon icon-tabler icon-tabler-search"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
              <path d="M21 21l-6 -6" />
            </svg>
          </div>
          {Object.values(selectedItems).some(Boolean) && (
            <button
              className="bg-[#1daa61] mb-4 text-gray-900 px-4 py-2 rounded-md hover:bg-[#359967]  transition-all duration-300 ease-in-out"
              style={{
                transform: "translateY(0)",
                opacity: 1,
                transition:
                  "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
              }}
              onClick={() => {
                sendMessageForwardButton();
              }}
            >
              Send
            </button>
          )}
          <div className="overflow-scroll">
            {(searchTerm ? filteredUsers : userList).length > 0 ? (
              (searchTerm ? filteredUsers : userList).map((user) =>
                renderUser(user)
              )
            ) : (
              <h2 className="flex justify-center items-center h-[200px]">
                No contacts found
              </h2>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default Forward;
