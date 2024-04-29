import React, { useState } from "react";

const ViewProfileGroub = ({
  conversations,
  currentConversationId,
  users,
  loggedId,
  groupData,
  fetchMessages,
}) => {
  const [sideBar, setSideBar] = useState("Overview"); // Ubah menjadi useState
  const [searchTerm, setSearchTerm] = useState("");

  const classc =
    "flex items-center hover:bg-[#606060] hover:text-white hover:rounded p-2 cursor-pointer transition duration-100";

  const conversation = conversations.find(
    (conversation) => conversation.conversationId === currentConversationId
  );
  const userConversationIndividual = conversation?.user;

  const createdAtDate = new Date(conversation?.createdAt);

  // Mendapatkan tanggal, bulan, tahun, jam, dan menit
  const date = createdAtDate.getDate();
  const month = createdAtDate.getMonth() + 1; // Bulan dimulai dari 0, jadi perlu ditambah 1
  const year = createdAtDate.getFullYear();
  const hours = createdAtDate.getHours();
  const minutes = createdAtDate.getMinutes().toString().padStart(2, "0"); // Tambahkan 0 di depan jika kurang dari 10

  // Format sesuai keinginan (contoh: DD/MM/YYYY HH:MM)
  const formattedDate = `${date}/${month}/${year} ${hours}:${minutes}`;
  const pathUserLogged = loggedId.img;
  const index = pathUserLogged.indexOf("uploads");
  // Mengambil substring dari indeks 'uploads' hingga akhir string
  const relativePath = pathUserLogged.substring(index);

  const filteredMembers = conversation?.members
    ?.filter((memberId) => {
      const adminIsLoggedUser =
        groupData.admin === loggedId.id && memberId === loggedId.id
          ? loggedId
          : null;
      const userGroup = users.find((user) => user.user.id === memberId);
      return (
        userGroup?.user.fullName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (adminIsLoggedUser &&
          adminIsLoggedUser.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
      );
    })
    .map((memberId) => {
      const userGroup = users.find((user) => user.user.id === memberId);
      const adminIsLoggedUser =
        groupData.admin === loggedId.id && memberId === loggedId.id
          ? loggedId
          : null;
      return userGroup?.user || adminIsLoggedUser; // Mengembalikan fullName dari userGroup
    });

  const filteredGroupNames = conversations
    .filter((conversation) => {
      return (
        conversation.type === "group" &&
        conversation.members.includes(loggedId.id) &&
        conversation.members.includes(userConversationIndividual?.id)
      );
    })
    .map((group) => {
      return {
        conversationId: group.conversationId,
        admin: group.admin,
        type: group.type,
        name: group.name,
        members: group.members,
        img: group.img,
      };
    })
    .filter((group) => {
      // Mengecek apakah setiap bidang dari grup mengandung searchTerm
      return Object.values(group).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
  // .filter((name) => {
  //   return name.includes(searchTerm.toLowerCase());
  // });
  return (
    <div
      className={`flex w-96 h-[400px] bg-[#343434] p-[5px] rounded-lg shadow-lg text-white `}
    >
      <div className={`rounded w-[30%] shadow-lg text-white mr-4 p-1`}>
        <div
          className={`${classc} text-sm font-thin mb-1`}
          onClick={() => setSideBar("Overview")}
        >
          Overview
        </div>
        {conversation.type === "group" && (
          <div
            className={`${classc} text-sm font-thin mb-1`}
            onClick={() => setSideBar("Members")}
          >
            Members
          </div>
        )}
        <div
          className={`${classc} text-sm font-thin`}
          onClick={() => setSideBar("Media")}
        >
          Media
        </div>
        {conversation.type === "individual" && (
          <div
            className={`${classc} text-sm font-thin mb-1`}
            onClick={() => setSideBar("Groups")}
          >
            Groups
          </div>
        )}
      </div>

      {/* Tambahkan logika tampilan berdasarkan nilai sideBar */}
      {sideBar === "Overview" && (
        <div className="w-[70%] flex flex-col mt-3">
          <img
            src={`http://127.0.0.1:8000/${
              conversation.type === "group"
                ? conversation.img
                : conversation.user.img
            }`}
            className="rounded-full w-20 h-20 items-center justify-center "
          />

          <p className="font-semibold text-lg">
            {conversation.type === "group"
              ? conversation.name
              : conversation.user.fullName}
          </p>
          {conversation.type === "group" ? (
            <div>
              <p className="font-thin text-xs pt-2 pb-1">Created</p>
              <p className="font-base text-sm">{formattedDate}</p>

              <p className="font-thin text-xs pt-2 pb-1">Description</p>
              <p>{conversation.description}</p>
            </div>
          ) : (
            <div>
              <p className="font-thin text-xs pt-2 pb-1">Email</p>{" "}
              <p className="font-base text-sm">{conversation.user.email}</p>
            </div>
          )}
        </div>
      )}
      {/* Tambahkan tampilan untuk Members */}
      {conversation.type === "group" && sideBar === "Members" && (
        <div className="w-[70%] flex flex-col mt-3 mr-2 max-h-[60vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#343434] z-10 py-2">
            <p className="font-semibold">
              Members {`(${conversation.members.length})`}
            </p>
            <input
              className="border border-gray-300 focus:outline-none text-gray-900 items-center focus:border-blue-500 rounded-md px-3 py-2 mt-2"
              type="text"
              placeholder="Search"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm ? (
            <div className="flex flex-col my-2">
              {filteredMembers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-row p-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer"
                >
                  <img
                    src={`http://127.0.0.1:8000/${
                      loggedId.id === user.id ? relativePath : user.img
                    }`}
                    className="h-10 w-10 rounded-full"
                    alt="Member Avatar"
                  />

                  <div className="flex flex-col flex-grow">
                    <div className="flex justify-start items-start">
                      <p className="ml-2 text-sm">
                        {(() => {
                          const loggedUser = loggedId.id === user.id;

                          if (loggedUser) {
                            return "You";
                          } else if (user.fullName) {
                            return user.fullName;
                          } else {
                            return user.id;
                          }
                        })()}
                      </p>
                    </div>
                    {groupData.admin === user.id && (
                      <div className="flex justify-end items-end">
                        <p className="mr-2 text-sm">Admin</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col my-2">
              {conversation.members.map((memberId) => (
                <div
                  key={memberId}
                  className="flex flex-row p-2 hover:bg-[#606060] hover:text-white hover:rounded-md cursor-pointer"
                >
                  {(() => {
                    const userGroup = users.find(
                      (user) => user.user.id === memberId
                    );
                    const admin = loggedId.id === memberId;

                    return (
                      <img
                        src={`http://127.0.0.1:8000/${
                          userGroup?.user?.img || relativePath
                        }`}
                        className="h-10 w-10 rounded-full"
                        alt="Member Avatar"
                      />
                    );
                  })()}

                  <div className="flex flex-col flex-grow">
                    <div className="flex justify-start items-start">
                      <p className="ml-2 text-sm">
                        {(() => {
                          const userGroup = users.find(
                            (user) => user.user.id === memberId
                          );
                          const loggedUser = loggedId.id === memberId;

                          if (loggedUser) {
                            return "You";
                          } else if (userGroup) {
                            return userGroup.user.fullName;
                          } else {
                            return memberId;
                          }
                        })()}
                      </p>
                    </div>
                    {groupData.admin === memberId && (
                      <div className="flex justify-end items-end">
                        <p className="mr-2 text-sm">Admin</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tambahkan tampilan untuk Media */}
      {sideBar === "Media" && (
        <div className="w-[70%] flex flex-col mt-3 mr-2">
          {/* Tambahkan tampilan untuk Media di sini */}
        </div>
      )}

      {sideBar === "Groups" && (
        <div className="w-[70%] flex flex-col mt-3 mr-2 max-h-[60vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#343434] z-10 py-2">
            <p className="font-semibold">Groups (7)</p>
            <input
              className="border border-gray-300 focus:outline-none text-gray-900 items-center focus:border-blue-500 rounded-md px-3 py-2 mt-2"
              type="text"
              placeholder="Search"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm ? (
            <div className="flex flex-col">
              {filteredGroupNames.map(
                ({ conversationId, name, members, type, admin, img }) => (
                  <div
                    key={conversationId}
                    className="flex flex-col my-2"
                    onClick={() =>
                      fetchMessages(
                        conversationId,
                        members,
                        "",
                        type,
                        name,
                        admin
                      )
                    }
                  >
                    <div className="flex flex-row p-2 hover:bg-[#606060] items-center hover:text-white hover:rounded-md cursor-pointer">
                      <img
                        src={`http://127.0.0.1:8000/${img}`}
                        className="h-10 w-10 rounded-full"
                        alt="Member Avatar"
                      />
                      <div className="flex flex-col flex-grow">
                        <div className="flex justify-start items-start">
                          <p className="ml-2 text-md">{name}</p>
                        </div>
                        <p className="ml-2 text-xs font-thin">
                          {members.length} members
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations
                .filter((conversation) => {
                  return (
                    conversation.type === "group" &&
                    conversation.members.includes(loggedId.id) &&
                    conversation.members.includes(
                      userConversationIndividual?.id
                    )
                  );
                })
                .map((group) => (
                  <div
                    key={group.conversationId}
                    className="flex flex-col my-2"
                    onClick={() =>
                      fetchMessages(
                        group.conversationId,
                        group.members,
                        "",
                        group.type,
                        group.name,
                        group.admin
                      )
                    }
                  >
                    <div className="flex flex-row p-2 hover:bg-[#606060] items-center hover:text-white hover:rounded-md cursor-pointer">
                      <img
                        src={`http://127.0.0.1:8000/${group.img}`}
                        className="h-10 w-10 rounded-full"
                        alt="Member Avatar"
                      />
                      <div className="flex flex-col flex-grow">
                        <div className="flex justify-start items-start">
                          <p className="ml-2 text-md">{group.name}</p>
                        </div>
                        <p className="ml-2 text-xs font-thin">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewProfileGroub;
