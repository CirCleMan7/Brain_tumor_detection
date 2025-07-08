import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import Modal from "./Components/Form/Modal";
import React, {useState, useEffect} from 'react'
import { v4 as uuidv4 } from "uuid";
import "./App.css"
import Introduction from "./Components/Introduction";
import { useNavigate } from "react-router-dom";
import { toDataURL } from "./utils/toDataURL";

const formatMetrics = (metrics) => {
  if (!metrics) return "No metrics available.";

  let metricStrings = Object.entries(metrics).map(([key, value]) => {
    if (typeof value === 'object') {
      const perClass = Object.entries(value).map(
        ([label, val]) => `  - ${label}: ${JSON.stringify(val)}`
      ).join('\n');
      return `${key}:\n${perClass}`;
    }
    return `${key}: ${value}`;
  });

  return metricStrings.join('\n');
};

async function sendImageAndTextToFlowiseFromUrl(content, info, imageUrl) {
  // 1. Construct the aiPrompt as you already have it
  // const aiPrompt = `
  //     🧠 Brain Tumor Analysis Report

  //     🔍 Case Details:
  //     - Test Indication: ${content.testIndication}
  //     - Scan Dimension: ${content.selectedDimension}
  //     - Sample Collection Date: ${content.sampleCollectionDate}

  //     👤 Patient Information:
  //     - Patient ID: ${content.patientId}
  //     - Name: ${content.patientFirstName} ${content.patientLastName}

  //     👨‍⚕️ Referring Doctor:
  //     - Name: Dr. ${content.doctorFirstName} ${content.doctorLastName}

  //     📊 Model Output:
  //     ${info}

  //     📝 Based on the provided case information and model output, please offer any clinical insights, follow-up recommendations, or further tests you would advise. The more comprehensive, the better.
  //     `.trim();

  try {
    // 2. Fetch the image from the provided URL
    console.log("Type of imageUrl:", typeof imageUrl);
    console.log("Value of imageUrl:", imageUrl)
    console.log("image 1")
    console.log(imageUrl[2]);
    
    // const image = imageUrl[2];
    
    const response = await fetch(imageUrl);
    console.log("Content-Type:", response.headers.get("Content-Type"));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
    }
    
    const imageBlob = await response.blob(); // Get the image as a Blob
    console.log("Blob type:", imageBlob.type);

    // Determine MIME type. You might need a more robust way if the server doesn't send it.
    // Ideally, the server should set the Content-Type header correctly.
    // If not, you might infer it from the URL's extension or use a default.
    const mimeType = response.headers.get('Content-Type') || 'application/octet-stream';
    const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1); // Extract filename from URL

    // 3. Read the Blob as a Data URL (Base64)
    const reader = new FileReader();

    // This returns a Promise-like behavior, so we wrap it for async/await
    const base64Data = await new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const fullDataUrl = event.target.result; // "data:image/png;base64,..."
        const base64Only = fullDataUrl.split(",")[1]; // Cut off "data:image/png;base64,"
        resolve(base64Only);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(imageBlob);
    });    

    console.log()


    if (!content || typeof content !== "string") {
      throw new Error("Content (question) must be a valid string");
    }
    
    if (!base64Data) {
      throw new Error("Base64 image data is missing");
    }
    
    if (!fileName) {
      throw new Error("File name is missing");
    }
    
    if (!mimeType) {
      throw new Error("Mime type is missing");
    }
    

    // 4. Construct the request body with both 'question' and 'uploads'
    const requestBody = {
      question: content, // Your text prompt goes here
      uploads: [
        {
          data: base64Data, // Base64 encoded image data
          type: "file",
          name: fileName,
          mime: mimeType,
        },
      ],
      // Add other optional parameters like history, sessionId, overrideConfig if needed
      // history: [],
      // sessionId: "your-session-id-here",
    };

    // 5. Send the request to Flowise
    // Replace <CHATFLOW_ID> with the actual ID of your Flowise chatflow.
    // You can find this in your Flowise UI when you deploy or publish a chatflow.
    const flowiseRes = await fetch("http://localhost:8000/flowise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!flowiseRes.ok) {
      const errorData = await flowiseRes.json();
      throw new Error(`Flowise API error: ${flowiseRes.status} ${flowiseRes.statusText} - ${JSON.stringify(errorData)}`);
    }

    const flowiseOutput = await flowiseRes.json();
    console.log("Flowise Response:", flowiseOutput);
    return flowiseOutput;

  } catch (error) {
    console.error("Error sending data to Flowise:", error);
    throw error;
  }
}

export default function App() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Handler for creating new chat from modal submit
  async function createNewChat(topic, content) {
    
    const is3D = content.selectedDimension === "3D";
    const is2D = content.selectedDimension === "2D";
    
    const chatId = uuidv4();

    // Step 1: Add new chat immediately
    const newChat = {
      id: chatId,
      topic: topic,
      content: content,
      conversation: [
        {
          sender: "ai",
          text: "🧠 Processing your data...",
        },
      ],
    };
    setChats((prev) => [...prev, newChat]);

    // Step 2: Navigate to new chat page
    navigate(`/chat/${chatId}`);

    // Step 3: Process backend (first submit_case, then gemini)
    try {
      const formData = new FormData();

      // Add string fields
      formData.append("doctorFirstName", content.doctorFirstName ?? "");
      formData.append("doctorLastName", content.doctorLastName ?? "");
      formData.append("patientId", content.patientId ?? "");
      formData.append("sampleCollectionDate", content.sampleCollectionDate ?? "");
      formData.append("testIndication", content.testIndication ?? "");
      formData.append("selectedDimension", content.selectedDimension ?? "");

      // Add individual files
      if (content.flairFiles[0] instanceof File) {
        formData.append("flairFiles", content.flairFiles[0]);
      }

      if (content.t1ceFiles[0] instanceof File) {
        formData.append("t1ceFiles", content.t1ceFiles[0]);
      }

      // if (content.other instanceof File) {
      //   formData.append("files", content.other); // "files" = the general file field
      // }
      
      const res = await fetch("http://localhost:8000/submit_case", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();  // helpful for debugging
        throw new Error(`Backend error: ${res.status} - ${errText}`);
      }      
      
      const data = await res.json();
      console.log("data")
      console.log(data);

      const info = is2D ? `Tumor type from predict : ${data.tumor_type_predict} and testIndication ${content.testIndication}` : `data.predicted_labels : ${data.predicted_labels}, tumor_volume : ${data.tumor_volume}, tumor_slices : ${data.tumor_slices} and testIndication ${content.testIndication}`;

      const viewerImages = data.image_urls;
      console.log("this is my image file");
      console.log(data.image_urls[0]);

      // const imageMarkdown = d
      // const aiPrompt = `
      // 🧠 Brain Tumor Analysis Report

      // 🔍 Case Details:
      // - Test Indication: ${content.testIndication}
      // - Scan Dimension: ${content.selectedDimension}
      // - Sample Collection Date: ${content.sampleCollectionDate}

      // 👤 Patient Information:
      // - Patient ID: ${content.patientId}
      // - Name: ${content.patientFirstName} ${content.patientLastName}

      // 👨‍⚕️ Referring Doctor:
      // - Name: Dr. ${content.doctorFirstName} ${content.doctorLastName}

      // 📊 Model Output:
      // ${info}

      // 📝 Based on the provided case information and model output, please offer any clinical insights, follow-up recommendations, or further tests you would advise. The more comprehensive, the better. Can you also describe what do you think about image that we send. what is your opinion
      // `.trim();

      const basePrompt = `Please describe what is ${info} and suggested for treatment based on providing guidance.`;


      const dataofModel = "this is a 2D brain which have overlay on a tumor"

      // Optionally send to Gemini
      // const flowiseRes = await fetch("http://localhost:8000/flowise", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ prompt: aiPrompt }),
      // });



      // const flowiseData = await flowiseRes.json();

      const flowiseData = await sendImageAndTextToFlowiseFromUrl(basePrompt, dataofModel, data.image_urls[0]);
      console.log("flowise content");
      console.log(flowiseData)
      const aiReply = flowiseData.reply?.text || "❌ Failed to connect AI.";

      // Assume backend returns .images only for 2D, and maybe slices or imageURL for 3D
      // Assume backend returns .images only for 2D, and maybe image_url + predicted_labels for 3D
      let conversation = [{ sender: "ai", text: "✅ Case processed successfully." }];

      if (is2D && data.images?.length) {
        conversation.push({ sender: "ai", text: "🖼️ Detected 2D images from your file." });
      }

      if (is3D) {
        conversation.push({ sender: "ai", text: "🧠 Detected 3D scan (NIfTI). Opening viewer..." });

        // ✅ Include predicted tumor labels (optional)
        if (data.predicted_labels?.length) {
          conversation.push({
            sender: "ai",
            text: `🧪 Tumor Types Detected: ${data.predicted_labels.join(", ")}`,
          });
        }
      }

      conversation.push({
        sender: "ai",
        text: 
          "## 🧠 Brain Tumor Segmentation Report\n" +
          "### 👨‍⚕️ Doctor\n" +
          `**${content.doctorFirstName} ${content.doctorLastName}**\n` +
          "### 👤 Patient\n" +
          `**${content.patientFirstName} ${content.patientLastName}**\n` +
          `🆔 Patient ID: \`${content.patientId}\`\n` +
          "### 📅 Sample Collection Date\n" +
          `\`${content.sampleCollectionDate}\`\n` +
          "### 🔬 Test Indication\n" +
          `\`${content.testIndication}\`\n` +
          "### 🖼️ Scan Dimension\n" +
          `\`${content.selectedDimension}\`\n` +
          "---\n" +
          "### 📊 Model Output\n" +
          `${is2D 
            ? `\`\`\`\n${formatMetrics(data.metrics)}\n\`\`\`\n### Prediction\n\`${data.tumor_type_predict}\`` 
            : `**Predicted labels:** \`${data.predicted_labels}\` | **Tumor volume:** \`${data.tumor_volume}\` | **Tumor slices:** \`${data.tumor_slices}\``
          }`
      });
      
      

      conversation.push({ sender: "ai", text: aiReply });
      // Now include all 3 in order: FLAIR, T1CE, Segmentation
      
      // const viewerImages = data.image_urls;
      // ✅ Update chat state with additional 3D image url (or 2D image previews)
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                content: {
                  ...c.content,
                  viewerImages: viewerImages,
                  metric: is2D ? data.metric || [] : [], // 2D preview images
                  predictedLabels: is3D ? data.predicted_labels : [],
                },
                conversation,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Processing failed:", err.message);
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                conversation: [
                  { sender: "ai", text: "❌ Failed to process case." },
                ],
              }
            : c
        )
      );
    }
  }

    // Load from localStorage on first mount
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  // Save to localStorage every time chats change
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  return (
    <>
      <div style={{ display: "flex" }}>
        <Sidebar
          chats={chats}
          setChats={setChats}
          showModal={showModal}
          setShowModal={setShowModal}
        />

        <div style={{ marginLeft: "250px", padding: "20px", flex: 1, }}>
          <Routes>
            <Route path="/chat/:id" element={<ChatPage chats={chats} setChats={setChats} showModal={showModal} />} />
            <Route path="/" element={<Introduction/>} />
          </Routes>
        </div>
      </div>

      {/* Render modal here at top level */}
      {showModal && (
        <Modal
          chats={chats}
          onClose={() => setShowModal(false)}
          onSubmit={(topic, content) => {
            setShowModal(false);
            createNewChat(topic, content);
          }}
        />
      )}
    </>
  );
}
