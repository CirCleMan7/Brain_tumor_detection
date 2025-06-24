import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./chat.css";

export default function ChatPage({ chats }) {
  const { id } = useParams();
  const chat = chats.find((c) => c.id === id);

  const [messages, setMessages] = useState([
    { sender: "ai", text: chat?.content || "" },
  ]);

  const [input, setInput] = useState(""); 

  async function getGeminiMessage(userPrompt) {
    const res = await fetch("http://localhost:8000/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    const data = await res.json();
    return data.reply || "No response from Gemini";
    // return "Yes";
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
    setInput(""); // Clear input box

    // Show typing indicator
    setMessages((prev) => [...prev, { sender: "ai", text: "typing..." }]);

    const aiResponse = await getGeminiMessage(trimmed);

    // Replace typing with AI reply
    setMessages((prev) => [
      ...prev.slice(0, -1),
      { sender: "ai", text: aiResponse },
    ]);
  };

  // test ---------------------------------------------

  const bottomRef = useRef();
  const chatLogRef = useRef();
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const chatLog = chatLogRef.current;
  
    const handleScroll = () => {
      const isAtBottom =
        chatLog.scrollHeight - chatLog.scrollTop <= chatLog.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };
  
    chatLog?.addEventListener("scroll", handleScroll);
    return () => chatLog?.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const [showImage, setShowImage] = useState(true);

  const styles = {
    fixedContainer: {
      position: "fixed",
      top: "20px",
      left: "58%",
      transform: "translateX(-50%)",
      background: "white",
      borderRadius: "12px",
      padding: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      zIndex: 999,
      textAlign: "center",
    },
    image: {
      maxWidth: "400px",
      height: "auto",
      borderRadius: "8px",
      marginBottom: "8px",
    },
    arrow: {
      cursor: "pointer",
      fontSize: "20px",
    },
    toggleButton: {
      position: "fixed",
      top: "10px",
      left: "58%",
      transform: "translateX(-50%)",
      background: "#eee",
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      zIndex: 998,
    },
  };

  // test ---------------------------------------------

  if (!chat) return <div>Chat not found</div>;

  return (
    
    <div className="chat-page">
      {showImage && (
      <div style={styles.fixedContainer}>
        {chat.content.files?.[0] && chat.content.files[0].type.startsWith("image/") ? (
        <img
          src={URL.createObjectURL(chat.content.files[0])}
          alt="Uploaded"
          style={styles.image}
        />
        ) : (
          <img
            src="/brain_icon.png"
            alt="default"
            style={styles.image}
          />
        )}
        <div style={styles.arrow} onClick={() => setShowImage(false)}>
          ⬆️
        </div>
      </div>
      )}

      {!showImage && (
        <div style={styles.toggleButton} onClick={() => setShowImage(true)}>
          ⬇️ Show Image
        </div>
      )}
        
      <div className="chat-log">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
