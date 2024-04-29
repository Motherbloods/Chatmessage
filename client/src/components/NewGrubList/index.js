import React, { useState } from "react";

const NewGrubList = ({ onClosePopup, users, userLogin, socket }) => {
  const [isNextStep, setIsNextStep] = useState(true);
  const [isFinished, setIsFinished] = useState(true);
  const [data, setData] = useState({
    name: "", // Set fullName to undefined only when isSignedIn is false
    description: "",
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fungsi untuk menangani klik pengguna
  const handleClick = (user) => {
    // Periksa apakah pengguna sudah ada dalam array selectedUsers
    const isAlreadySelected = selectedUsers.some(
      (selectedUser) => selectedUser.user.id === user.user.id
    );

    if (!isAlreadySelected) {
      // Jika pengguna belum dipilih, tambahkan ke array selectedUsers
      setSelectedUsers((prevSelectedUsers) => [...prevSelectedUsers, user]);
    }
  };

  const handleClose = (id) => {
    // Gunakan filter untuk menghapus pengguna dengan ID tertentu
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.filter((user) => user.user.id !== id)
    );
  };

  // Fungsi untuk menangani penyimpanan data
  const handleSave = async (e) => {
    const currentDate = new Date();
    setIsFinished(false);
    e.preventDefault();
    const options = {
      name: data.name,
      description: data.description,
      createdAt: currentDate.toISOString(),
      adminId: userLogin.id,
      members: selectedUsers.map(({ user }) => user.id),
    };
    const body = JSON.stringify(options);
    const res = await fetch(` http://127.0.0.1:8000/api/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!res.ok) {
      // Tangani kesalahan, misalnya menampilkan pesan kesalahan kepada pengguna
      console.error("Error during fetch:", res.status, res.statusText);
      return;
    }

    if (res.ok) {
      const resData = await res.json();
      console.log("inifsdfds", resData);
      socket.emit("sendConversations", {
        conversationId: resData.group._id,
        senderId: resData.group.admin,
        receiverId: resData.group.members,
        message: null,
        date: currentDate.toISOString(),
        admin: resData.group.admin,
        type: resData.group.type,
        name: resData.group.name,
        img: resData.group.img,
        description: resData.group.description,
      });
    }
  };
  const nextStepCreateGrup = () => {
    setIsNextStep(false);
  };
  return (
    isFinished && (
      <div
        className={`top-0 absolute h-full w-full z-10 bg-transparent flex justify-center items-center`}
      >
        <div
          className={`h-[60%] w-[40%] bg-red-300 p-4 rounded-lg shadow-lg relative`}
        >
          {isNextStep ? (
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-square-rounded-x absolute right-[-40px] top-[-30px]"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="#000"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={onClosePopup}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 10l4 4m0 -4l-4 4" />
                <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
              </svg>
              <div className="flex overflow-x-auto mb-4 scroll-smooth">
                <div className="flex ">
                  {selectedUsers.map((selectedUser, index) => (
                    <div
                      key={index}
                      className="rounded-full mr-2 mt-2 w-20 h-20 bg-black flex items-center justify-center text-white relative"
                    >
                      <img
                        src={`http://127.0.0.1:8000/${selectedUser.user.img}`}
                        alt="Selected user image"
                        className="rounded-full w-full h-full"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-square-rounded-x absolute top-[-5px] right-[-10px] cursor-pointer"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        strokeWidth="1"
                        stroke="#FFF"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        onClick={() => handleClose(selectedUser.user.id)}
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M10 10l4 4m0 -4l-4 4" />
                        <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex overflow-hidden h-[100%] w-full scroll-smooth">
                <div
                  className={`flex flex-col w-full over ${
                    selectedUsers.length > 0 ? "h-[250px]" : "h-[320px]"
                  }  overflow-scroll scroll-smooth`}
                >
                  {users.map((user, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-md w-full my-2 cursor-pointer flex"
                      onClick={() => handleClick(user)}
                    >
                      <img
                        className="rounded-full mr-5"
                        src={`http://127.0.0.1:8000/${user.user.img}`}
                        width="50"
                        height="50"
                        alt="User image"
                      />
                      <div>
                        <p className="font-bold">{user.user.fullName}</p>
                        <p className="font-light"> {user.user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-circle-arrow-right-filled absolute right-3 bottom-3 cursor-pointer"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="#000000"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={nextStepCreateGrup}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path
                  d="M12 2l.324 .005a10 10 0 1 1 -.648 0l.324 -.005zm.613 5.21a1 1 0 0 0 -1.32 1.497l2.291 2.293h-5.584l-.117 .007a1 1 0 0 0 .117 1.993h5.584l-2.291 2.293l-.083 .094a1 1 0 0 0 1.497 1.32l4 -4l.073 -.082l.064 -.089l.062 -.113l.044 -.11l.03 -.112l.017 -.126l.003 -.075l-.007 -.118l-.029 -.148l-.035 -.105l-.054 -.113l-.071 -.111a1.008 1.008 0 0 0 -.097 -.112l-4 -4z"
                  strokeWidth="0"
                  fill="currentColor"
                />
              </svg>
            </div>
          ) : (
            <form className="space-y-4">
              <div className="flex overflow-x-auto mb-4 scroll-smooth">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon icon-tabler icon-tabler-circle-arrow-left ml-[-1px] cursor-pointer"
                  width="35"
                  height="35"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="#000000"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onClick={() => setIsNextStep(true)}
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 21a9 9 0 1 0 0 -18a9 9 0 0 0 0 18" />
                  <path d="M8 12l4 4" />
                  <path d="M8 12h8" />
                  <path d="M12 8l-4 4" />
                </svg>
                <div className="flex">
                  {selectedUsers.map((selectedUser, index) => (
                    <div
                      key={index}
                      className="rounded-full mr-2 mt-2 w-20 h-20 bg-black flex items-center justify-center text-white relative"
                    >
                      <img
                        src={`http://127.0.0.1:8000/${selectedUser.user.img}`}
                        alt="Selected user image"
                        className="rounded-full w-full h-full"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-square-rounded-x absolute top-[-5px] right-[-10px] cursor-pointer"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        strokeWidth="1"
                        stroke="#FFF"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        onClick={() => handleClose(selectedUser.user.id)}
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M10 10l4 4m0 -4l-4 4" />
                        <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Name:
                </label>
                <input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e) =>
                    setData({ ...data, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 w-full rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    )
  );
};

export default NewGrubList;
