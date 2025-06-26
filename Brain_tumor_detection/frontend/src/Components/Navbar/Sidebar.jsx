import { Link, useLocation } from "react-router-dom";
import React, {useState} from "react";
import "./button.css";
import ExportButton from "./ExportButton";

export default function Sidebar({ chats, setShowModal }) {

  const location = useLocation();

  return (
    <div style={{
      width: "240px",
      height: "100vh",
      backgroundColor: "#DFDFDF",
      padding: "20px",
      position: "fixed",
      top: 0,
      left: 0,
      color: "white",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <Link to="/">
        <img src="/brain_icon.png" alt="brain" width="50px" />
      </Link>
      <br></br>
      <button id="new-case-button" onClick={() => setShowModal(true)}>+ New case</button>
      <h2 style={{color: "black", opacity: "0.6", fontSize: "20"}}>Case</h2>
      {chats.map((chat, index) => {
        const isActive = location.pathname === `/chat/${chat.id}`;
        return (
          <div
            key={index}
            className={`chat-link-box ${isActive ? "active-chat" : ""}`}
          >
            <Link className="chat-link" to={`/chat/${chat.id}`}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <ExportButton />
                   <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginLeft: "10px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>{chat.topic}</div>
                    <div style={{ fontSize: "12px", color: "black", fontWeight: "lighter" }}>uncase ({chat.content.selectedDimension})</div>
                  </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

const linkStyle = {
  display: "block",
  color: "white",
  textDecoration: "none",
  padding: "8px 0"
};
