import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import Modal from "./Components/Form/Modal";
import React, {useState, useEffect} from 'react'
import { v4 as uuidv4 } from "uuid";
import "./App.css"
import Introduction from "./Components/Intoduction";

export default function App() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Handler for creating new chat from modal submit
  function createNewChat(topic, content, aiReply) {
    const newChat = {
      id: uuidv4(),
      topic: topic,
      content: content,
      conversation: [
        {
          sender: "ai",
          text: aiReply || `New case created for ${topic}`,
        },
      ],
    };
    setChats((c) => [...c, newChat]);

    console.log("this is form app.jsx")
    console.log(newChat.content);
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
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar
          chats={chats}
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
          onClose={() => setShowModal(false)}
          onSubmit={(topic, content) => {
            createNewChat(topic, content);
            setShowModal(false);
          }}
        />
      )}
    </Router>
  );
}
