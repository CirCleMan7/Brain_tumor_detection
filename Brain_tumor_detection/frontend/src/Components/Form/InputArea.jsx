function InputArea(props) {
    return (
        <div className="input-box" style={{ display: "flex", maxWidth: "300px" }}>
        <div className="input-group" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ color: "black", marginBottom: "4px", marginLeft: "10px" }}>{props.title}</label>
          <textarea
          id="story"
          name="story"
          rows="5"
          placeholder={props.placeholder || "ข้อบ่งชี้ในการตรวจ..."}
          style={{
            width: "700px",
            height: "120px",
            padding: "12px",
            border: "2px solid #000000",
            borderRadius: "12px",
            backgroundColor: "#f0f0f0",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            marginTop: "20px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        />
        </div>
      </div>      
    )
}

export default InputArea;