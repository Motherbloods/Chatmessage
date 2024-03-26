import React, { useEffect, useState, useRef } from "react";
const Reply = React.forwardRef(
  (
    {
      messageId,
      message,
      senderId,
      nama,
      notifyDashboard,
      className,
      onCloseReply,
      replyNotifiy,
      onShowForward,
      deleteNotify,
    },
    ref
  ) => {
    const [isCopied, setIsCopied] = useState(false);
    const containerRef = useRef(null);
    console.log(`Received`, containerRef);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target)
        ) {
          onCloseReply(); // Panggil fungsi onClose saat klik di luar area div
        }
      };
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onCloseReply]);

    useEffect(() => {
      let timeoutId;
      if (isCopied) {
        timeoutId = setTimeout(() => {
          setIsCopied(false);
          notifyDashboard(false);
          onCloseReply();
        }, 100);
      }
      return () => {
        clearTimeout(timeoutId);
      };
    }, [isCopied]);

    const handleCopyClick = () => {
      copyToClipboard(message);
      setIsCopied(true);
      notifyDashboard(true);
    };
    const copyToClipboard = (text) => {
      // Create a temporary textarea element
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);

      // Select and copy the text inside the textarea
      textarea.select();
      document.execCommand("copy");

      // Remove the temporary textarea
      document.body.removeChild(textarea);

      // Log a message or perform any additional actions
      console.log(`Copied message: ${isCopied}`);
    };

    const handleReplyClick = () => {
      replyNotifiy(true, nama, message, messageId);
      onCloseReply();
    };

    const handleForwardClick = () => {
      onShowForward(true);
      onCloseReply();
    };

    const handleDeleteClick = () => {
      deleteNotify(messageId);
    };

    return (
      <div
        className={`bg-[#343434] w-56 border rounded-md p-3 shadow-lg text-white ${className}`}
        ref={containerRef}
      >
        <div
          className={`flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100`}
          onClick={handleCopyClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-copy mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            ref={ref}
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
            <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
          </svg>
          <h2>Copy</h2>
        </div>

        <div
          className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100"
          onClick={handleReplyClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-copy mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
            <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
          </svg>
          <h2>Reply</h2>
        </div>
        <hr className="border-t border-gray-600 my-2" />
        <div
          className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100"
          onClick={handleForwardClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-copy mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
            <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
          </svg>
          <h2>Forward</h2>
        </div>
        <div
          className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100"
          onClick={handleDeleteClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-trash mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 7l16 0" />
            <path d="M10 11l0 6" />
            <path d="M14 11l0 6" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
          <h2>Delete</h2>
        </div>
        <div className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-square-check mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
            <path d="M9 12l2 2l4 -4" />
          </svg>
          <h2>Select</h2>
        </div>
        <div className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-info-circle mr-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#fff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
            <path d="M12 9h.01" />
            <path d="M11 12h1v4h1" />
          </svg>
          <h2>Info Pesan</h2>
        </div>
      </div>
    );
  }
);

export default Reply;
