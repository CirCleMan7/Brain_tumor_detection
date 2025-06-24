import { Link } from "react-router-dom";
import React, {useState} from "react";
import "./button.css";
import Modal from "../Form/Modal";
import { v4 as uuidv4 } from "uuid";

export default function Sidebar({ chats, setChats }) {

  const [showModal, setShowModal] = useState(false);

  function createNewChat(topic, content) {
    const newChat = {
      id: uuidv4(),
      topic: topic,
      content: content
    };
    setChats(c => [...c, newChat]);
  }

  return (
    <div style={{
      width: "200px",
      height: "100vh",
      backgroundColor: "#DFDFDF",
      padding: "20px",
      position: "fixed",
      top: 0,
      left: 0,
      color: "white"
    }}>
      <img src="/brain_icon.png" alt="brain" width="50 px"></img> <br></br>
      <button id="new-case-button" onClick={() => setShowModal(true)}>+ New case</button>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onSubmit={(topic, content) => {
            createNewChat(topic, content);
            setShowModal(false);
          }}
        />
      )}

      <h2 style={{color: "black", opacity: "0.6", fontSize: "20"}}>Case</h2>
      {chats.map((chat, index) => (
        <div key={index}>
        <Link to={`/chat/${chat.id}`}>
          {chat.topic}
        </Link>
      </div>  
      ))}

    </div>
  );
}

const linkStyle = {
  display: "block",
  color: "white",
  textDecoration: "none",
  padding: "8px 0"
};
