import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./chat.css";
import "./arrow.css";
import ChatInput from "./ChatInput";
import PapayaViewer from "./../PapayaViewer"
import PapayaViewerNew from "./../PapayaViewerNew"
import Show2DImage from "./Show2DImage";
import { loadPapayaOnce } from "./../../utils/loadPapayaOnce";

// eslint-disable-next-line no-undef
const papaya = window.papaya;

export default function ChatPage({ chats, setChats, showModal }) {

  const { id } = useParams();
  const chat = chats.find((c) => c.id === id);
  
  // Initialize conversation state with chat conversation if exists
  const [conversation, setConversation] = useState(chat?.conversation || []);
  const [input, setInput] = useState("");
  const [showImage, setShowImage] = useState(false);

  // Update conversation whenever chat changes (like switching chats)
  useEffect(() => {
    setConversation(chat?.conversation || []);
    setShowImage(false);
  }, [chat]);

  useEffect(() => {
    setShowImage(false);
  }, [chat?.content?.selectedDimension]) 
  
  const [abortController, setAbortController] = useState(null);
  
  async function getFlowiseMessage(userPrompt) {
    const controller = new AbortController();
    setAbortController(controller);
    
    console.log("Conversation");
    console.log(chat)

    try {
      const res = await fetch("http://localhost:8000/flowise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
        signal: abortController?.signal,
      });
      
      if (!res.ok) throw new Error("Server error");
      
      const data = await res.json();
      return data?.reply || "No response from Gemini";
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
    const aiResponse = await getFlowiseMessage(trimmed);
    
    // Replace typing with actual AI response
    const updatedMessages = [
      ...newMessages.slice(0, -1),
      { sender: "ai", text: aiResponse.text },
    ];
    setConversation(updatedMessages);
    
    // Update global chats state with new conversation
    setChats((prevChats) =>
    prevChats?.map((c) =>
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
  
  // ==============================================================================
  // for auto going down when typing
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  useEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    
    const handleScroll = () => {
      const isAtBottom =
      chatLog.scrollHeight - chatLog.scrollTop <= chatLog.clientHeight + 100;
      setShowScrollButton(!isAtBottom);
    };
    
    chatLog.addEventListener("scroll", handleScroll);
    return () => chatLog.removeEventListener("scroll", handleScroll);
  }, [conversation]);


  // const [papayaReady, setPapayaReady] = useState(false);

  
  // useEffect(() => {
  // if (!showScrollButton && bottomRef.current) {
  //     bottomRef.current.scrollIntoView("smooth");
  //   }
  // }, [conversation]);
  // ==============================================================================
  // papaya viewer
  
  // useEffect(() => {
  //   const jqueryScript = document.createElement("script");
  //   jqueryScript.src = "https://code.jquery.com/jquery-3.6.0.min.js";
  //   jqueryScript.async = true;
    
  //   const cleanup = [];
    
  //   jqueryScript.onload = () => {
  //     const css = document.createElement("link");
  //     css.rel = "stylesheet";
  //     css.href = "/papaya.css";
  //     document.head.appendChild(css);
  //     cleanup.push(() => document.head.removeChild(css));
      
  //     window.papaya = window.papaya || {};
  //     window.papaya.params = {
  //       images: ["/Users/sakonkiat/Desktop/SuperAI-Brain_Tumor/fastapi-brain-segmentation/data/BraTS20_Training_002_flair.nii"]
  //     };
      
  //     const papayaScript = document.createElement("script");
  //     papayaScript.src = "/papaya.js";
  //     papayaScript.async = true;
      
  //     papayaScript.onerror = () => {
  //       console.error("Failed to load papaya.js");
  //     };
      
  //     let timeout = setTimeout(() => {
  //       console.warn("Papaya load timeout.");
  //     }, 10000);
      
  //     papayaScript.onload = () => {
  //       clearTimeout(timeout);
        
  //       const waitForPapayaDiv = () => {
  //         const maxTries = 20;
  //         let tries = 0;
          
  //         const interval = setInterval(() => {
  //           const papayaDiv = document.querySelector(".papaya");
  //           if (papayaDiv) {
  //             clearInterval(interval);
              
  //             if (window.papaya.Container.viewer) {
  //               window.papaya.Container.resetViewer(0, true);
  //             }
              
  //             window.papaya.Container.startPapaya();
  //           } else if (++tries >= maxTries) {
  //             clearInterval(interval);
  //             console.warn("Could not find .papaya div.");
  //           }
  //         }, 200);
  //       };
        
  //       waitForPapayaDiv();
  //     };
      
  //     document.body.appendChild(papayaScript);
  //     cleanup.push(() => document.body.removeChild(papayaScript));
  //   };
    
  //   document.body.appendChild(jqueryScript);
  //   cleanup.push(() => document.body.removeChild(jqueryScript));
    
  //   return () => {
  //     cleanup.forEach((fn) => fn());
  //     if (window.papaya && window.papaya.Container && window.papaya.Container.viewer) {
  //       window.papaya.Container.resetViewer(0, true);
  //     }
  //   };
  // }, []);
  
  // useEffect(() => {
  //   // Start Papaya on mount
  //   if (
  //     window.papaya &&
  //     window.papaya.Container &&
  //     document.querySelector(".papaya")
  //     ) {
  //       window.papaya.Container.startPapaya();
  //       setTimeout(() => {
  //         window.papaya.Container.resizeViewerComponents(); // 🪄 Fix layout glitch
  //       }, 300);
  //     }
      
  //     // Clean up on unmount
  //     return () => {
    //       if (
      //           window.papaya?.Container?.viewer?.length > 0
      //         ) {
        //           window.papaya.Container.resetViewer(0, true);
        //         }
        //       };
        //     }, []);
        
        // ==============================================================================

  const [viewerParams, setViewerParams] = useState(null);

  const loadExampleImages = () => {
    console.log("check")
    console.log(chat.content.viewerImages[0])
    console.log(chat.content.viewerImages[1])
    console.log(chat.content.viewerImages[2])
    setViewerParams({
      images: [
        chat.content.viewerImages[0],  // base image
        chat.content.viewerImages[1],  // overlay image
      ],
      kioskMode: false,
      showControlBar: true,
      smoothDisplay: false,
      // กำหนดพารามิเตอร์ overlay ตามชื่อไฟล์
      [chat.content.viewerImages[1]]: {
        lut: "Red Overlay",
        alpha: 0.5,
        min: 0,
        max: 3,
      },
    });
  };
  
  const imageFiles3D = chat?.content?.viewerImages?.map((path, i) => ({
    image: path,
    name: `image_${i + 1}`,
  })) || [];
  
  const papayaDivRef = useRef(null);
  const [papayaReady, setPapayaReady] = useState(false);
  
  // ==============================================================================
  // for make a scroll page only 2D 
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  const styles = {
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
      position: "absolute",
      left: "-30px",
      top: "40%",
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

  const [viewerKey, setViewerKey] = useState(0);

  const handlePredict = async () => {
    // หลังจากส่ง request ไป backend แล้วได้ blob + file
    // console.log(chat)
    const baseImageDataURL = chat.content.viewerImages[0];
    const segDataURL = chat.content.viewerImages[2];

    const params = {
      images: [baseImageDataURL, segDataURL],
      kioskMode: false,
      showControlBar: true,
      smoothDisplay: false,
    };
    params[segDataURL] = {
      lut: "Red Overlay",
      alpha: 0.5,
      min: 0,
      max: 3,
    };

    setViewerParams(params); // <<< trigger ให้ Papaya render
  };

  const handleCloseViewer = () => {
    setShowImage(false);
  };
  
  const handleOpenViewer = () => {
    setViewerKey((prev) => prev + 1); // force remount
    setShowImage(true);
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
    <div className={`chat-page ${showImage ? "row-layout" : ""}`}>
  
      {/* Left: Viewer */}
      {showImage && (
        <div className="viewer-container" style={{ width: 800 /* fix width for viewer */ }}>
          {chat?.content?.selectedDimension === "2D" ? (
            <Show2DImage
              key={chat.id}
              setShowImage={setShowImage}
              imageFiles={
                Array.isArray(chat?.content?.viewerImages)
                  ? chat.content.viewerImages.map((url, i) => ({
                      url,
                      name: `image_${i + 1}.png`,
                    }))
                  : []
              }
            />
          ) : (
            <>
              <div>
                <h1>Brain Tumor Segmentation</h1>
                <button onClick={loadExampleImages}>Predict & Show</button>
                <PapayaViewerNew viewerParams={viewerParams} />
              </div>
              <div onClick={handleCloseViewer}>
                <div className="arrow left" />
              </div>
            </>
          )}
        </div>
      )}
  
      {/* Right: Chat Section */}
      <div className="chat-container" style={{ flexGrow: 1, marginLeft: 20 }}>
        {!showImage && (chat?.content?.viewerImages?.length > 0 || chat.content.selectedDimension === "3D") && (
          <div
            style={styles.toggleButton}
            className="arrow right"
            onClick={handleOpenViewer}
          />
        )}
  
        <div key={chat.id} className="chat-log" ref={chatLogRef}>
          {conversation.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === "ai" && (
                  <>
                    <img src="/ai-icon.png" className="ai-icon" alt="AI Icon" />
                    <div className="sender-name">AI Brain Expert</div>
                  </>
                )}
                <div className="bubble">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* <div className="papaya"></div> */}
  
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isTyping={isTyping}
          cancelTyping={cancelTyping}
          disabled={conversation?.length <= 1}
          chat={chat}
        />
      </div>
    </div>
  );  
}
