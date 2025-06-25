import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import Modal from "./Components/Form/Modal";
import React, {useState} from 'react'
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Handler for creating new chat from modal submit
  function createNewChat(topic, content) {
    const newChat = {
      id: uuidv4(),
      topic: topic,
      content: content
    };
    setChats(c => [...c, newChat]);
  }

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
            <Route path="/chat/:id" element={<ChatPage chats={chats} showModal={showModal} />} />
            <Route path="/" element={<h2>Select a chat</h2>} />
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
