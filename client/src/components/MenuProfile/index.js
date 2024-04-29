import React from "react";

const MenuProfile = ({ className, popUpForm }) => {
  const clickPopUp = () => {
    popUpForm(true);
  };
  return (
    <div
      className={`bg-[#343434] w-44 border rounded-md p-2 shadow-lg text-white ${className}`}
      onClick={clickPopUp}
    >
      <div className="flex items-center hover:bg-[#606060] hover:text-white hover:rounded-md p-2 cursor-pointer transition duration-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="icon icon-tabler icon-tabler-user mr-2"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#fff"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
          <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
        </svg>
        <h2>Change Profile</h2>
      </div>
    </div>
  );
};

export default MenuProfile;
