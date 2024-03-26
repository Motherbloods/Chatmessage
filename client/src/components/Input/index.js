import React, { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";

export default function Input({
  label = "",
  name = "",
  type = "text",
  className = "",
  inputClassName = "",
  isRequired = false,
  placeholder = "",
  value = "",
  onChange = () => {},
  onEmojiSelect = () => {},
  showEmojiPicker,
  toggleEmojiPicker,
  onKeyPress,
}) {
  const [showLocalEmojiPicker, setShowLocalEmojiPicker] = useState(false);

  useEffect(() => {
    setShowLocalEmojiPicker(showEmojiPicker);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData, event) => {
    const emoji = emojiData.emoji;
    onEmojiSelect(emoji);
  };

  return (
    <div className={` ${className}`}>
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-800 "
      >
        {label}
      </label>
      <div className="relative ">
        <input
          type={type}
          id={name}
          className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${inputClassName} `}
          placeholder={placeholder}
          required={isRequired}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
        />
        <button
          type="button"
          onClick={() => {
            toggleEmojiPicker(); // Panggil fungsi toggleEmojiPicker
            setShowLocalEmojiPicker((prev) => !prev);
          }}
          className="absolute top-[5px] right-2 p-2 focus:outline-none"
        >
          🌟
        </button>
        <div className="absolute bottom-[90px] right-0">
          {showLocalEmojiPicker && (
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              disableSearchBar
              disableSkinTonePicker
              disableAutoFocus
              disablePreview
              disableHeader
            />
          )}
        </div>
      </div>
    </div>
  );
}
