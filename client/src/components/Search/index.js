import React from "react";

export default function Search({
  label = "",
  name = "",
  type = "text",
  className = "",
  inputClassName = "",
  isRequired = false,
  placeholder = "",
  value = "",
  onChange = () => {},
  searchValue,
  setSearchValue,
}) {
  return (
    <div className={` ${className}`}>
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-800 "
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          id={name}
          className={`border-[1.1px] bg-[#f3f2f2] drop-shadow-md focus:drop-shadow-[0_4px_3px_rgba(29,54,48,0.23)] focus:bg-gray-50 border-[#e1dfda]  text-gray-900 text-sm rounded-md  block w-full p-2.5 pl-10 outline-none transition-all duration-300 ease-in-out${inputClassName}`}
          placeholder={placeholder}
          required={isRequired}
          value={value}
          onChange={onChange}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 icon icon-tabler icon-tabler-search"
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
        {searchValue && (
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x absolute right-3 top-1/2 transform -translate-y-1/2"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#2c3e50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={() => setSearchValue("")}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
