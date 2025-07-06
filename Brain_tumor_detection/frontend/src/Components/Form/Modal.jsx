import React, { useState, useRef } from "react";
import "./formStyle.css";
import buttonStyles from "./FormButton.module.css";

export default function Modal({ onClose, onSubmit, chats }) {
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sampleCollectionDate, setSampleCollectionDate] = useState("");
  const [testIndication, setTestIndication] = useState("");
  const [selectedDimension, setSelectedDimension] = useState("2D");
  const [flairFiles, setFlairFiles] = useState([]);
  const [t1ceFiles, setT1ceFiles] = useState([]);
  const flairFileInputRef = useRef(null);
  const t1ceFileInputRef = useRef(null);

  const handleClickDimension = (value) => {
    if (value !== selectedDimension) {
      setSelectedDimension(value);
      handleResetFiles();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const topic = `${patientFirstName} ${patientLastName}`;
    if (chats.some(chat => chat.topic?.trim().toLowerCase() === topic?.trim().toLowerCase())) {
      alert("Topic already exists. Please choose another.");
      return;
    }
    const content = {
      doctorFirstName,
      doctorLastName,
      patientId,
      sampleCollectionDate,
      testIndication,
      selectedDimension,
      flairFiles,
      t1ceFiles,
    };
    onSubmit(topic, content);
  };

  const handleFlairClick = () => {
    flairFileInputRef.current.click();
  };

  const handleT1ceClick = () => {
    t1ceFileInputRef.current.click();
  };

  const handleFlairFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const allowedExts = [".nii", ".nii.gz", ".npy",  ".png", ".jpg", ".jpeg"];

    const allowedFiles = newFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      return allowedExts.some((ext) => lowerName.endsWith(ext));
    });

    const allFiles = [...flairFiles, ...allowedFiles];
    const unique = Array.from(new Set(allFiles.map((f) => f.name))).map((name) =>
      allFiles.find((f) => f.name === name)
    );
    setFlairFiles(unique);
    event.target.value = null;
  };

  const handleResetFiles = () => {
    if (flairFileInputRef.current) flairFileInputRef.current.value = null;
    if (t1ceFileInputRef.current) t1ceFileInputRef.current.value = null;

    setFlairFiles([]);
    setT1ceFiles([]);
  };

  const handleT1ceFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
  
    // Allowed extensions
    const allowedExts = [".nii", ".nii.gz", ".npy", ".jpg", ".jpeg", ".png"];
  
    // Filter files by extension
    const allowedFiles = newFiles.filter((file) => {
      const lowerName = file.name.toLowerCase();
      return allowedExts.some((ext) => lowerName.endsWith(ext));
    });
  
    // Combine with existing files, keep unique by name
    const allFiles = [...t1ceFiles, ...allowedFiles];
    const unique = Array.from(new Set(allFiles.map((f) => f.name))).map((name) =>
      allFiles.find((f) => f.name === name)
    );
  
    setT1ceFiles(unique);
    event.target.value = null;
  };
  
  const getFileIcon = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".nii") || lower.endsWith(".nii.gz")) return "🧠";
    if (lower.endsWith(".npy")) return "🗃️";  // icon for numpy array file
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return "🖼️";
    return "📁";
  };
  

  const handleRemoveFlairFile = (index) => {
    setFlairFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveT1ceFile = (index) => {
    setT1ceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay">
      <div className="container">
        <button className="close-button" onClick={onClose} type="button"></button>
        <div className="text">Information form</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="input-data">
              <input type="text" value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} required />
              <div className="underline"></div>
              <label>Patient First Name</label>
            </div>
            <div className="input-data">
              <input type="text" value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} required />
              <div className="underline"></div>
              <label>Patient Last Name</label>
            </div>
          </div>

          <div className="form-row">
            <div className="input-data">
              <input type="text" value={doctorFirstName} onChange={(e) => setDoctorFirstName(e.target.value)} />
              <div className="underline"></div>
              <label>Doctor First Name</label>
            </div>
            <div className="input-data">
              <input type="text" value={doctorLastName} onChange={(e) => setDoctorLastName(e.target.value)} />
              <div className="underline"></div>
              <label>Doctor Last Name</label>
            </div>
          </div>

          <div className="form-row">
            <div className="input-data">
              <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
              <div className="underline"></div>
              <label>Patient ID</label>
            </div>
            <div className="input-data">
              <input type="date" value={sampleCollectionDate} onChange={(e) => setSampleCollectionDate(e.target.value)} />
              <div className="underline"></div>
              <label>Sample Date</label>
            </div>
          </div>

          <div className="form-row">
            <div className="input-data textarea">
              <textarea value={testIndication} style={{ width: "100%", height: "120px" }} onChange={(e) => setTestIndication(e.target.value)} required />
              <div className="underline"></div>
              <label>Diagnostic indication</label>
            </div>
          </div>

          <div className="form-row">
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginLeft: "17px" }}>
              <button
                type="button"
                className={`dimension-button ${selectedDimension === "2D" ? "dimension-selected-button" : ""}`}
                onClick={() => handleClickDimension("2D")}
              >
                <span>2D Dimension</span>
              </button>
              <button
                type="button"
                className={`dimension-button ${selectedDimension === "3D" ? "dimension-selected-button" : ""}`}
                onClick={() => handleClickDimension("3D")}
              >
                <span>3D Dimension</span>
              </button>
            </div>
          </div>

          {selectedDimension === "2D" ? (
  <>
    {/* Brain Image Upload */}
    <div className="form-row">
      <div className="file-upload-section">
        <div className="file-upload-header">
          <h3>2D Brain Image (.png, .jpg, .npy, .nii, .nii.gz):</h3>
          <button type="button" onClick={handleFlairClick} className={buttonStyles["add-file-button"]}>Upload Image</button>
        </div>
        <input 
          type="file" 
          ref={flairFileInputRef} 
          onChange={handleFlairFileChange} 
          accept=".png,.jpg,.jpeg,.npy,.nii,.nii.gz"
          style={{ display: "none" }} 
        />
        <div className="file-list">
          {flairFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={() => handleRemoveFlairFile(index)} className="remove-file-btn">✖</button>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Mask Image Upload */}
    <div className="form-row">
      <div className="file-upload-section">
        <div className="file-upload-header">
          <h3>Mask Image (same formats):</h3>
          <button type="button" onClick={handleT1ceClick} className={buttonStyles["add-file-button"]}>Upload Mask</button>
        </div>
        <input 
          type="file" 
          ref={t1ceFileInputRef} 
          onChange={handleT1ceFileChange} 
          accept=".png,.jpg,.jpeg,.npy,.nii,.nii.gz"
          style={{ display: "none" }} 
        />
        <div className="file-list">
          {t1ceFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={() => handleRemoveT1ceFile(index)} className="remove-file-btn">✖</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
) : (
  <>
    {/* FLAIR Upload for 3D */}
    <div className="form-row">
      <div className="file-upload-section">
        <div className="file-upload-header">
          <h3>FLAIR Scan (.nii or .nii.gz):</h3>
          <button type="button" onClick={handleFlairClick} className={buttonStyles["add-file-button"]}>Upload FLAIR</button>
        </div>
        <input 
          type="file" 
          ref={flairFileInputRef} 
          onChange={handleFlairFileChange} 
          accept=".nii,.nii.gz"
          style={{ display: "none" }} 
        />
        <div className="file-list">
          {flairFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={() => handleRemoveFlairFile(index)} className="remove-file-btn">✖</button>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* T1CE Upload for 3D */}
    <div className="form-row">
      <div className="file-upload-section">
        <div className="file-upload-header">
          <h3>T1CE Scan (.nii or .nii.gz):</h3>
          <button type="button" onClick={handleT1ceClick} className={buttonStyles["add-file-button"]}>Upload T1CE</button>
        </div>
        <input 
          type="file" 
          ref={t1ceFileInputRef} 
          onChange={handleT1ceFileChange} 
          accept=".nii,.nii.gz"
          style={{ display: "none" }} 
        />
        <div className="file-list">
          {t1ceFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span>{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={() => handleRemoveT1ceFile(index)} className="remove-file-btn">✖</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
)}



          <div className="form-row submit-btn">
            <div className="input-data">
              <div className="inner"></div>
              <input type="submit" value="submit" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}