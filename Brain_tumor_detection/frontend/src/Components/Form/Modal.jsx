import React, { useState, useRef } from "react";
import "./Modal.css";
import InputBox from "./InputBox";
import InputArea from "./InputArea";
import "./button.css";

export default function Modal({ onClose, onSubmit }) {
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sampleCollectionDate, setSampleCollectionDate] = useState("");
  const [testIndication, setTestIndication] = useState("");

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [selectedDimension, setSelectedDimension] = useState("2D");

  const handleClickDimension = (value) => {
    if (value !== selectedDimension) {
      setSelectedDimension(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const topic = `${patientFirstName} ${patientLastName}`;
    const content = {
      doctorFirstName,
      doctorLastName,
      patientId,
      sampleCollectionDate,
      testIndication,
      selectedDimension,
      files,
    };
  
    onSubmit(topic, content); // Let App.jsx take over
  };
  
  function getFileIcon(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "🖼️";
    if (lower.endsWith(".nii")) return "🧠";
    return "📁";
  }
  
  function handleRemoveFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }
  
  function handleClick() {
      fileInputRef.current.click();
  }

  function handleFileChange(event) {
    const newFiles = Array.from(event.target.files);
  
    // Validate file types
    const allowedFiles = newFiles.filter((file) => {
      const isPDF = file.type === "application/pdf";
      const isJPG = file.type.startsWith("image/jpeg");
      const isPNG = file.type.startsWith("image/png");
      const isNii = file.name.toLowerCase().endsWith(".nii");
      return isPDF || isJPG || isPNG || isNii;
    });
  
    // Avoid duplicates by name
    const allFiles = [...files, ...allowedFiles];
    const unique = Array.from(new Set(allFiles.map((f) => f.name))).map((name) =>
      allFiles.find((f) => f.name === name)
    );
  
    setFiles(unique);
    event.target.value = null; // reset file input
  }
  
  
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <img src="../../public/brain_image.png" alt="brain_image" style={{position: "absolute", width: "130px", marginBottom: "0px"}}></img>
        <button className="close-button" onClick={onClose}></button>
        <div className="input-box">
          <button id="dimension-isSelected-button" 
            className={`${selectedDimension === "2D" ? "dimension-notSelected-button" : ""}`}
            onClick={() => handleClickDimension("2D")}> 2 Dimension
          </button>
          <button id="dimension-isSelected-button" 
            className={`${selectedDimension === "3D" ? "dimension-notSelected-button" : ""}`}
            onClick={() => handleClickDimension("3D")}> 3 Dimension
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <InputBox info={patientFirstName} setTopic={setPatientFirstName} title={"ชื่อ (ผู้ป่วย)"} required={true} type={"text"}/>
            <InputBox info={patientLastName} setTopic={setPatientLastName} title={"นามสกุล (ผู้ป่วย)"} required={true} type={"text"}/>
          </div>
          <div className="input-box">
          <InputBox info={doctorFirstName} setTopic={setDoctorFirstName} title={"ชื่อจริง (แพทย์ผู้สั่งตรวจ)"} required={false} type={"text"}/>
          <InputBox info={doctorLastName} setTopic={setDoctorLastName} title={"นามสกุล (แพทย์ผู้สั่งตรวจ)"} required={false} type={"text"}/>
          </div>
          <div className="input-box">
          <InputBox info={patientId} setTopic={setPatientId} title={"รหัสประจำตัวผู้ป่วย"} required={false} type={"text"}/>
          <InputBox info={sampleCollectionDate} setTopic={setSampleCollectionDate} title={"วันที่เก็บตัวอย่าง"} required={false} type={"date"}/>
          </div>
          <div className="input-box-area">
            <InputArea info={testIndication} setTopic={setTestIndication} title={"ข้อบ่งชี้ในการตรวจ"} required={false}></InputArea>
          </div>


          <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "30px", alignItems: "flex-start" }}>
          <button type="button" className="add-file-button" onClick={handleClick}>Upload</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          {/* 📄 File List (Small Left Panel) */}
          <div style={{
            maxWidth: '90%',
            maxHeight: '120px',   // limit height
            overflowX: 'auto',    // horizontal scrollbar
            whiteSpace: 'nowrap', // keep images in one line
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            marginBottom: '10px',
          }}>
            <strong style={{ fontSize: "0.95rem", marginBottom: "4px", color: "#333" }}>Files</strong>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <span style={{ fontSize: "18px" }}>{getFileIcon(file.name)}</span>
                  <div style={{ fontSize: "0.8rem", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                    {file.name}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc3545",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>

          {/* 📤 Upload + Create Buttons */}
          <div style={{ display: "flex", marginTop: "10px", marginLeft: "100px",flexDirection: "column", gap: "30px", alignItems: "center" }}>
            <button type="submit" className="add-file-button">Submit</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
