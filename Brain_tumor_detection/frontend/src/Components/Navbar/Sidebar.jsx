import { Link, useLocation } from "react-router-dom";
import React, {useRef} from "react";
import { useNavigate } from "react-router-dom";
import ButtonStyles from "./navbarButton.module.css"
import ExportButton from "./ExportButton";

export default function Sidebar({ chats, setChats ,setShowModal }) {

  const location = useLocation();

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  function removeChat(id) {
    setChats(prev => prev.filter(chat => chat.id !== id));
  }  

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      alert("Please upload a JSON file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        // Optional: Validate your chat JSON structure here
        console.log("get json");

        if (!json.id || !json.topic) {
          alert("Invalid chat data.");
          return;
        }

        console.log("making chat");

        setChats((prev) => [...prev, json]);
        navigate(`/chat/${json.id}`);

        console.log("finish");

      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };

    reader.readAsText(file);

    // Reset input so same file can be uploaded again if needed
    event.target.value = null;
  };

  return (
    <div style={{
      width: "240px",
      height: "100vh",
      background: "linear-gradient(to right, #F8F8F8, #EFEFEF)",
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
      <button id={ButtonStyles["new-case-button"]} onClick={() => setShowModal(true)}>+ New case</button>
      <button id={ButtonStyles["upload-button"]} onClick={handleUploadClick} >Upload chat</button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <h2 style={{color: "black", opacity: "0.6", fontSize: "20"}}>Case</h2>
      {chats.map((chat, index) => {
        const isActive = location.pathname === `/chat/${chat.id}`;
        return (
          <div
            key={index}
            className={`${ButtonStyles["chat-link-box"]} ${isActive ? ButtonStyles["active-chat"] : ""}`}
          >
            <Link className={ButtonStyles["chat-link"]} to={`/chat/${chat.id}`}>
              <div title={chat.topic} style={{ display: "flex", alignItems: "center" }}>
                <ExportButton chat={chat} />
                   <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", marginLeft: "10px" }}>
                    <button className={ButtonStyles["close-button"]} onClick={() => removeChat(chat.id)} style={{position: "absolute", left: "105px", bottom: "25px"}}></button>
                    <div style={{ fontSize: "14px", fontWeight: "bold", textOverflow: "ellipsis", maxWidth: "120px", overflow: "hidden", whiteSpace: "nowrap" }}>{chat.topic}</div>
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
