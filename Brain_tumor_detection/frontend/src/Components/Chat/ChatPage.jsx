import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./chat.css";
import "./arrow.css";
import ChatInput from "./ChatInput";

export default function ChatPage({ chats, setChats, showModal }) {
  const { id } = useParams();
  const chat = chats.find((c) => c.id === id);

  // Initialize conversation state with chat conversation if exists
  const [conversation, setConversation] = useState(chat?.conversation || []);
  const [input, setInput] = useState("");

  // Update conversation whenever chat changes (like switching chats)
  useEffect(() => {
    setConversation(chat?.conversation || []);
  }, [chat]);

  const [abortController, setAbortController] = useState(null);

  async function getGeminiMessage(userPrompt) {
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch("http://localhost:8000/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      return data.reply || "No response from Gemini";
    } catch (error) {
      if (error.name === "AbortError") {
        // ✅ Handle cancellation gracefully
        console.log("Fetch was canceled");
        return "❌ AI response canceled by user."; // 👈 Return fallback
      }
      else {
        console.error("Failed to contact Gemini:", error.message);
        return "❌ Sorry, I couldn’t connect to the AI server.";
      }
    } finally {
      setAbortController(null); // clear it
    }
  }

  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {

    setIsTyping(true)

    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message and typing indicator
    const newMessages = [
      ...conversation,
      { sender: "user", text: trimmed },
      { sender: "ai", text: "typing..." },
    ];
    setConversation(newMessages);
    setInput("");

    // Get AI response
    const aiResponse = await getGeminiMessage(trimmed);

    // Replace typing with actual AI response
    const updatedMessages = [
      ...newMessages.slice(0, -1),
      { sender: "ai", text: aiResponse },
    ];
    setConversation(updatedMessages);

    // Update global chats state with new conversation
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chat.id ? { ...c, conversation: updatedMessages } : c
      )
    );

    setIsTyping(false);
  };

  const cancelTyping = () => {
    if (abortController) {
      abortController.abort(); // cancel fetch
    }
  
    setConversation((prev) => prev.filter((msg) => msg.text !== "typing..."));
    setIsTyping(false);
  };

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
  }, [conversation]);

  const [showImage, setShowImage] = useState(false);

  const imageFiles = [
    // AI generated images (usually base64 or URLs)
    ...(chat?.content?.imageUrls?.map((url, i) => ({
      url,
      name: `AI_generated_${i + 1}.png`,
      type: "image/ai",
    })) || []),
  
    // Uploaded images (png, jpg, jpeg)
    ...(chat?.content?.files
      ?.filter(f => f.url && /\.(png|jpe?g)$/i.test(f.name))
      ?.map(f => ({
        url: f.url,
        name: f.name,
        type: f.type || "image/unknown",
      })) || []),
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev < imageFiles.length - 1 ? prev + 1 : prev
    );
  };

  const styles = {
    fixedContainer: {
      position: "sticky",
      top: "20px",
      // left: "49px",
      marginLeft: "49%",
      transform: "translateX(-50%)",
      width: "90%",          // responsive width
      maxWidth: "1000px",    // max width so it doesn't get too big on big screens
      background: "white",
      borderRadius: "12px",
      padding: "10px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      zIndex: 999,
      textAlign: "center",
    },
    image: {
      maxWidth: "400px",
      height: "auto",
      borderRadius: "8px",
      marginBottom: "8px",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      opacity: 1,
    },    
    arrow: {
      position: "absolute",
      cursor: "pointer",
      left: "48%",
      fontSize: "20px",
    },
    toggleButton: {
      position: "fixed",
      left: "57%",
      cursor: "pointer",
      zIndex: 998,
    },
    imageNavArrow: {
      cursor: "pointer",
      fontSize: "24px",
      padding: "0 12px",
      userSelect: "none",
      color: "#333",
    },
    imageNavContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    
  };

  if (!chat) {
    return (
      <div style={{ padding: "20px", color: "black" }}>
        <h2>No chat found</h2>
        <p>Please select a chat from the sidebar or create a new case.</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {showImage && (
        <div style={styles.fixedContainer}>
          {imageFiles.length > 0 ? (
            <>
              {/* Image Navigation */}
              <div style={styles.imageNavContainer}>
                {/* Left Arrow */}
                <div style={styles.arrowWrapperLeft} onClick={handlePrev}>
                  <div className="arrow left" />
                </div>

                {/* Image */}
                <img
                  src={imageFiles[currentImageIndex].url}
                  alt={`Image ${currentImageIndex + 1}`}
                  style={styles.image}
                />

                {/* Right Arrow */}
                <div style={styles.arrowWrapperRight} onClick={handleNext}>
                  <div className="arrow right" />
                </div>
              </div>

              {/* Image Counter */}
              <div style={styles.counterText}>
                {currentImageIndex + 1} / {imageFiles.length}
              </div>
            </>
          ) : (
            <img src="/brain_icon.png" alt="default" style={styles.image} />
          )}

          {/* Close Image View */}
          <div style={styles.arrow} className="arrow up" onClick={() => setShowImage(false)} />
        </div>
      )}


      {!showImage && (
        <div style={styles.toggleButton} className="arrow down" onClick={() => setShowImage(true)}></div>
      )}

    {/* Add key here for instant chat switch */}
    <div key={chat.id} className="chat-log" ref={chatLogRef}>
    {conversation.map((msg, index) => (
      <div key={index} className={`message ${msg.sender}`}>
        <div className="message-content">
          {msg.sender === "ai" && (
            <>
              <img src="/ai-icon.png" className="ai-icon"></img>
              <div className="sender-name">AI Brain Expert</div>
            </>
          )}
          <div className="bubble">
            {msg.sender === "ai" ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    ))}

      <div ref={bottomRef} />
    </div>

    <ChatInput input={input} setInput={setInput} handleSend={handleSend} isTyping={isTyping} cancelTyping={cancelTyping} disabled={conversation.length <= 1} chat={chat}></ChatInput>
  </div>
  );
}
