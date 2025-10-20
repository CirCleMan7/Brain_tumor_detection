import "./formStyle.css";
import buttonStyles from "./FormButton.module.css";

function InputFile2D(handleFlairClick, flairFileInputRef, handleFlairFileChange, flairFiles, t1ceFiles) {
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
}

export default InputFile2D