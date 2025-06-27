import { useRef, useEffect, useState } from "react";
import './chatinput.css'

export default function ChatInput({ input, setInput, handleSend, isTyping, cancelTyping, disabled, chat }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // Grow to fit
    }
  }, [input]);

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [chat, disabled]); // runs when chat ID changes or becomes enabled

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      if (!isTyping) {
        handleSend();
      }
    }
  };

  return (
    <div className="chat-input-container">
        <div className="chat-input-inner">
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="chat-textarea"
              disabled= {disabled}
            />
          </div>
          {/* <button onClick={handleSend} className="send-button">Send</button> */}
          <button
            onClick={isTyping ? cancelTyping : handleSend}
            disabled={isTyping && !cancelTyping} // Optional: disable if canceling isn't allowed
            className={`chat-submit-button ${isTyping ? "cancel" : ""}`}
          >
            {isTyping ? "Cancel AI Response" : "Send"}
          </button>
      </div>
    </div>
  );
}
