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
      if (!isTyping) { // Only send if not currently typing
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
              // disabled={disabled} // Use the disabled prop directly
            />
          </div>
          <button
            onClick={isTyping ? cancelTyping : handleSend}
            // Disable button if input is empty AND not currently typing (to prevent sending empty messages)
            // Or if disabled prop is true
            // Or if isTyping is true AND cancelTyping is NOT provided (cannot cancel)
            disabled={disabled || (!input.trim() && !isTyping) || (isTyping && !cancelTyping)}
            className="send-button" // Use the 'send-button' class from CSS
          >
            {isTyping ? (
              // Icon for canceling AI response (e.g., a stop or cancel icon)
              <i className="fas fa-stop-circle"></i> // Font Awesome stop icon
            ) : (
              // Icon for sending (paper plane)
              <i className="fas fa-paper-plane"></i> 
            )}
          </button>
      </div>
    </div>
  );
}