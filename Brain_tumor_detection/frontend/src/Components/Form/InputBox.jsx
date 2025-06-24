import InputInfo from "./InputInfo";

function InputBox(props) {
    return (
        <div className="input-box" style={{ display: "flex", maxWidth: "300px" }}>
        <div className="input-group" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ color: "black", marginBottom: "4px", marginLeft: "10px" }}>{props.title}</label>
          <InputInfo info={props.info} set={props.setTopic} required={props.required} type={props.type}/>
        </div>
      </div>      
    )
}

export default InputBox;