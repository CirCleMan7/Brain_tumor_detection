function InputInfo({info, set = () => {}, type = "text"}, required) {
    return (
        <>
            <input
                type={type}
                value={info}
                onChange={(e) => set(e.target.value)}
                required = {required}
                style={{borderWidth: "2px", borderStyle: "solid", borderColor: "black"}}
            />
        </>
    );
  }  
export default InputInfo;
