import React, { useState } from "react";
import "./newChatButton.css";
import NewGrubList from "../NewGrubList";

const NewChatButton = ({ users, userLogin, socket }) => {
  // State to manage visibility of the "message" and "users group" SVG icons
  const [isIconsVisible, setIconsVisible] = useState(false);
  const [isGrubListVisible, setGrubListVisible] = useState(false);

  // Click handler to toggle visibility state
  const handleSquareRoundedClick = () => {
    setIconsVisible(!isIconsVisible);
  };
  const handleUsersGroupClick = () => {
    setIconsVisible(false);
    setGrubListVisible(!isGrubListVisible);
  };
  const slideClass = isIconsVisible ? "slide-enter" : "slide-exit";
  return (
    <div>
      <div className="absolute bottom-4 left-48">
        {isIconsVisible && (
          <div className={`rotate-transition ${slideClass}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-users-group cursor-pointer"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#000000"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={handleUsersGroupClick}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
              <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M17 10h2a2 2 0 0 1 2 2v1" />
              <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-message cursor-pointer"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#000000"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={() => {
                console.log("haloo ini messges");
              }}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M8 9h8" />
              <path d="M8 13h6" />
              <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
            </svg>
          </div>
        )}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-square-rounded-plus-filled cursor-pointer"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#ff2825"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          onClick={handleSquareRoundedClick}
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path
            d="M12 2l.324 .001l.318 .004l.616 .017l.299 .013l.579 .034l.553 .046c4.785 .464 6.732 2.411 7.196 7.196l.046 .553l.034 .579c.005 .098 .01 .198 .013 .299l.017 .616l.005 .642l-.005 .642l-.017 .616l-.013 .299l-.034 .579l-.046 .553c-.464 4.785 -2.411 6.732 -7.196 7.196l-.553 .046l-.579 .034c-.098 .005 -.198 .01 -.299 .013l-.616 .017l-.642 .005l-.642 -.005l-.616 -.017l-.299 -.013l-.579 -.034l-.553 -.046c-4.785 -.464 -6.732 -2.411 -7.196 -7.196l-.046 -.553l-.034 -.579a28.058 28.058 0 0 1 -.013 -.299l-.017 -.616c-.003 -.21 -.005 -.424 -.005 -.642l.001 -.324l.004 -.318l.017 -.616l.013 -.299l.034 -.579l.046 -.553c.464 -4.785 2.411 -6.732 7.196 -7.196l.553 -.046l.579 -.034c.098 -.005 .198 -.01 .299 -.013l.616 -.017c.21 -.003 .424 -.005 .642 -.005zm0 6a1 1 0 0 0 -1 1v2h-2l-.117 .007a1 1 0 0 0 .117 1.993h2v2l.007 .117a1 1 0 0 0 1.993 -.117v-2h2l.117 -.007a1 1 0 0 0 -.117 -1.993h-2v-2l-.007 -.117a1 1 0 0 0 -.993 -.883z"
            fill="currentColor"
            strokeWidth="0"
          />
        </svg>
      </div>
      {isGrubListVisible && (
        <NewGrubList
          onClosePopup={handleUsersGroupClick}
          users={users}
          userLogin={userLogin}
          socket={socket}
        />
      )}
    </div>
  );
};

export default NewChatButton;
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="icon icon-tabler icon-tabler-square-rounded-x absolute right-[-10px] top-0"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  strokeWidth="1.5"
  stroke="#fff"
  fill="none"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M10 10l4 4m0 -4l-4 4" />
  <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
</svg>;
