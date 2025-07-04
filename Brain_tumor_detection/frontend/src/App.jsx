import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import Modal from "./Components/Form/Modal";
import React, {useState, useEffect} from 'react'
import { v4 as uuidv4 } from "uuid";
import "./App.css"
import Introduction from "./Components/Intoduction";
import { useNavigate } from "react-router-dom";

export default function App() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Handler for creating new chat from modal submit
  async function createNewChat(topic, content) {
    
    const is3D = content.selectedDimension === "3D";
    const is2D = content.selectedDimension === "2D";
    
    const chatId = uuidv4();

    // Step 1: Add new chat immediately
    const newChat = {
      id: chatId,
      topic: topic,
      content: content,
      conversation: [
        {
          sender: "ai",
          text: "🧠 Processing your data...",
        },
      ],
    };
    setChats((prev) => [...prev, newChat]);

    // Step 2: Navigate to new chat page
    navigate(`/chat/${chatId}`);

    // Step 3: Process backend (first submit_case, then gemini)
    try {
      const formData = new FormData();
      Object.entries(content).forEach(([key, value]) => {
        if (key === "files") {
          for (const file of value) formData.append("files", file);
        } else {
          formData.append(key, value);
        }
      });
      
      const res = await fetch("http://localhost:8000/submit_case", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const aiPrompt = `Analyze case for ${topic}`;
      
      // Optionally send to Gemini
      const geminiRes = await fetch("http://localhost:8000/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const geminiData = await geminiRes.json();
      const aiReply = geminiData.reply || "❌ Failed to connect AI.";

      // Assume backend returns .images only for 2D, and maybe slices or imageURL for 3D
      let conversation = [{ sender: "ai", text: "✅ Case processed successfully." }];

      if (is2D && data.images?.length) {
        conversation.push({ sender: "ai", text: "🖼️ Detected 2D images from your file." });
      }

      if (is3D) {
        conversation.push({ sender: "ai", text: "🧠 Detected 3D scan (NIfTI). Opening viewer..." });
      }

      conversation.push({ sender: "ai", text: `Doctor name is ${content.doctorFirstName} ${content.doctorLastName}\nPatient name is ${content.patientFirstName} ${content.patientLastName}` });
      conversation.push({ sender: "ai", text: aiReply });

      console.log("Backend returned images:", data.images);

      // Step 4: Update conversation in chat
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                content: {
                  ...c.content,
                  imageUrls: is2D ? data.images || [] : [], // only attach for 2D
                },
                conversation: conversation,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Processing failed:", err.message);
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                conversation: [
                  { sender: "ai", text: "❌ Failed to process case." },
                ],
              }
            : c
        )
      );
    }
  }

    // Load from localStorage on first mount
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  // Save to localStorage every time chats change
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  return (
    <>
      <div style={{ display: "flex" }}>
        <Sidebar
          chats={chats}
          setChats={setChats}
          showModal={showModal}
          setShowModal={setShowModal}
        />

        <div style={{ marginLeft: "250px", padding: "20px", flex: 1 }}>
          <Routes>
            <Route path="/chat/:id" element={<ChatPage chats={chats} setChats={setChats} showModal={showModal} />} />
            <Route path="/" element={<Introduction/>} />
          </Routes>
        </div>
      </div>

      {/* Render modal here at top level */}
      {showModal && (
        <Modal
          chats={chats}
          onClose={() => setShowModal(false)}
          onSubmit={(topic, content) => {
            setShowModal(false);
            createNewChat(topic, content);
          }}
        />
      )}
    </>
  );
}
