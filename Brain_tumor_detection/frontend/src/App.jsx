import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import React, {useState} from 'react'

export default function App() {

  const [chats, setChats] = useState([]);

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar chats={chats} setChats={setChats} />
        <div style={{ marginLeft: "250px", padding: "20px", flex: 1 }}>
          <Routes>
            <Route path="/chat/:id" element={<ChatPage chats={chats} />} />
            <Route path="/" element={<h2>Select a chat</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}