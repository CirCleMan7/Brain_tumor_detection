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


  function handleSubmit(e) {
    e.preventDefault();
    if (patientFirstName.trim() && patientLastName.trim()) {
      const topic = `${patientFirstName} ${patientLastName}`;
      const content = {
        doctorFirstName,
        doctorLastName,
        patientId,
        sampleCollectionDate,
        testIndication,
        selectedDimension,
        files
      };
      onSubmit(topic, content); // send all data
      setPatientFirstName("");
      setPatientLastName("");
    }
  }

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

      // Validate by MIME type or extension
      const allowedFiles = newFiles.filter(file => {
          const isPDF = file.type === "application/pdf";
          const isJPG = file.type.startsWith("image/jpeg");
          const isNii = file.name.toLowerCase().endsWith(".nii");
          return isPDF || isJPG || isNii;
      });

      // Check total file limit
      const total = files.length + allowedFiles.length;
      if (total > 2) {
          alert("Please input only up to 2 files total.");
          event.target.value = null;
          return;
      }

      // Prevent duplicates by file name
      const allFiles = [...files, ...allowedFiles];
      const unique = Array.from(new Set(allFiles.map(f => f.name)))
          .map(name => allFiles.find(f => f.name === name));

      setFiles(unique);
      event.target.value = null; // allow re-selecting same file again
  }
  
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <img src="../../public/brain_image.png" alt="brain_image" style={{position: "absolute", width: "130px", marginBottom: "0px"}}></img>
        <button className="close-button" onClick={onClose}>Cancel</button>
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
          {/* <hr></hr>
          <label style={{color: "black", marginLeft: "160px"}}>optional</label> */}
          <div className="input-box">
          <InputBox info={doctorFirstName} setTopic={setDoctorFirstName} title={"ชื่อจริง (แพทย์ผู้สั่งตรวจ)"} required={false} type={"text"}/>
          <InputBox info={doctorLastName} setTopic={setDoctorLastName} title={"นามสกุล (แพทย์ผู้สั่งตรวจ)"} required={false} type={"text"}/>
          </div>
          <div className="input-box">
          <InputBox info={patientId} setTopic={setPatientId} title={"รหัสประจำตัวผู้ป่วย"} required={false} type={"text"}/>
          <InputBox info={sampleCollectionDate} setTopic={setSampleCollectionDate} title={"วันที่เก็บตัวอย่าง"} required={false} type={"date"}/>
          </div>
          <div className="input-box-area">
            <InputArea></InputArea>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "30px", alignItems: "flex-start" }}>
          {/* 📄 File List (Small Left Panel) */}
          <div
            style={{
              width: "250px",
              maxHeight: "300px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
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
            <button type="button" className="add-file-button" onClick={handleClick}>Upload</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
            <button type="submit" className="add-file-button">Create</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
