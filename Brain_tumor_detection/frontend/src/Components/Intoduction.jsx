function Introduction() {

    return (
        <div style={{
            padding: "60px 40px",
            maxWidth: "900px",
            margin: "40px auto",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: "1.7",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e0e0e0"
          }}>
            <h1 style={{
              fontSize: "2.8rem",
              fontWeight: "700",
              color: "#2c3e50",
              marginBottom: "25px",
              letterSpacing: "-0.5px"
            }}>
              <span style={{ color: "#3498db" }}>Brain Tumor</span> Detection Assistant
            </h1>
            <p style={{
              fontSize: "1.2rem",
              marginTop: "25px",
              color: "#555",
              lineHeight: "1.8",
              maxWidth: "700px",
              margin: "0 auto 20px auto"
            }}>
              Welcome to your intelligent assistant for <strong>brain tumor diagnosis</strong>. This platform helps medical professionals analyze brain images using <strong>AI-powered models</strong> trained specifically on 2D and 3D scans of the human brain.
            </p>
            <p style={{
              fontSize: "1.1rem",
              marginTop: "15px",
              color: "#666",
              lineHeight: "1.7",
              maxWidth: "700px",
              margin: "0 auto 20px auto"
            }}>
              Upload medical image files such as <code style={{
                backgroundColor: "#f0f0f0",
                padding: "3px 7px",
                borderRadius: "4px",
                fontFamily: "Consolas, monospace",
                color: "#c0392b"
              }}>.nii</code>, <code style={{
                backgroundColor: "#f0f0f0",
                padding: "3px 7px",
                borderRadius: "4px",
                fontFamily: "Consolas, monospace",
                color: "#c0392b"
              }}>.jpg</code>, or <code style={{
                backgroundColor: "#f0f0f0",
                padding: "3px 7px",
                borderRadius: "4px",
                fontFamily: "Consolas, monospace",
                color: "#c0392b"
              }}>.pdf</code>, and our AI will process them to generate interpretable results. The system uses deep learning models designed to assist with early tumor identification and visualization.
            </p>
            <p style={{
              fontSize: "1.1rem",
              marginTop: "15px",
              color: "#666",
              lineHeight: "1.7",
              maxWidth: "700px",
              margin: "0 auto 30px auto"
            }}>
              In addition, you can chat with our <strong>RAG-based chatbot</strong>—a virtual Professor of Brain Tumors—who can answer your questions, provide insights, and explain AI-generated findings in a medically grounded manner.
            </p>
            <p style={{
              fontSize: "1.15rem",
              marginTop: "40px",
              color: "#34495e",
              fontStyle: "italic",
              fontWeight: "600",
              padding: "10px 20px",
              backgroundColor: "#ecf0f1",
              borderRadius: "8px",
              display: "inline-block"
            }}>
              Get started by click new case on your left.
            </p>
          </div>
    )
}

export default Introduction;