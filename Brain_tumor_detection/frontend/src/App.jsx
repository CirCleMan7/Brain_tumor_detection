import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Components/Navbar/Sidebar";
import ChatPage from "./Components/Chat/ChatPage";
import Modal from "./Components/Form/Modal";
import React, {useState, useEffect} from 'react'
import { v4 as uuidv4 } from "uuid";
import "./App.css"
import Introduction from "./Components/Introduction";
import { useNavigate } from "react-router-dom";
import ModalDelete from "./Components/Navbar/ModalDelete";
import ModalInfo from "./Components/Navbar/ModalInfo"
// import PageNotFound from "./Components/Chat/PageNotFound"

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

async function sendToFlowise(content) {
  try {
    const requestBody = {
      question: content,
    };

    // const flowiseRes = await fetch("https://4xrw8qp1-8000.asse.devtunnels.ms/flowise", {
    const flowiseRes = await fetch("http://localhost:9000/flowise", {
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
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [showModalInfo, setShowModalInfo] = useState(false);
  const [interactChat, setInteractChat] = useState(null)
  const navigate = useNavigate();
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function removeChat(chat) {

    // 1. set id for delete
    let id = chat.id

    // 2. Delete all related image files
    // if (chat.content?.viewerImages?.length) {
    //   for (const img of chat.content.viewerImages) {
    //     await deleteFile(img); // assuming img.image is the URL
    //   }
    // }

    // 3. Remove the chat from state
    setChats(prev => prev.filter(c => c.id !== id));
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
          text: `🧠 Processing your data...`,
          process: true
        },
      ],
    };

    setChats((prev) => [...prev, newChat]);
    console.log(chats)

    await new Promise(r => setTimeout(r, 5000));

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

      // const res = await fetch("https://4xrw8qp1-8000.asse.devtunnels.ms/submit_case", {
      const res = await fetch("http://localhost:9000/submit_case", {
        method: "POST",
        body: formData,
      });
      
      console.log("create res")
      newChat.conversation[0].process = false
      if (!res.ok) {
        const errText = await res.text();  // helpful for debugging
        throw new Error(`Backend error: ${res.status} - ${errText}`);
      }      

      console.log(chats)
      console.log("test")
      const data = await res.json();
      // const data = {"text" : "eiei"}

      const info = is2D ? `Tumor type from predict : ${data.tumor_type_predict} and testIndication ${content.testIndication}` : `predicted_labels : ${data.predicted_labels}, tumor_volume : ${data.tumor_volume}, tumor_slices : ${data.tumor_slices} and testIndication ${content.testIndication}`;
      

      const viewerImages = data.image_urls;
      console.log("image :", viewerImages)
      const basePrompt = `Please describe what is ${info} and suggested for treatment based on providing guidance.`;

      // const flowiseData = await sendToFlowise(basePrompt);
      console.log("flowise content");
      // const aiReply = flowiseData.reply?.text || "❌ Failed to connect AI.";
      const aiReply = "❌ Failed to connect AI.";
      
      let conversation = [{ sender: "ai", text: "✅ Case processed successfully." }];
      
      if (is2D && data.images?.length) {
        conversation.push({ sender: "ai", text: "🖼️ Detected 2D images from your file." });
      }
      
      if (is3D) {
        conversation.push({ sender: "ai", text: "🧠 Detected 3D scan (NIfTI). Opening viewer..." });
        
        console.log("data : ")
        console.log(data);
        // ✅ Include predicted tumor labels (optional)
        if (data.predicted_labels?.length) {
          conversation.push({
            sender: "ai",
            text: `🧪 Tumor Types Detected: ${data.predicted_labels}`,
          });
        }
      }

      conversation.push({
        sender: "ai",
        text: 
          "# 🧠 Brain Tumor Segmentation Report\n" +
          "**👨‍⚕️ Doctor**\n" +
          `Dr.${content.doctorFirstName} ${content.doctorLastName}\n\n` +
          "**👤 Patient**\n" +
          `${content.patientFirstName} ${content.patientLastName}\n` +
          `**🆔 Patient ID**: ${content.patientId}\n\n` +
          "**📅 Sample Collection Date**\n" +
          `${content.sampleCollectionDate}\n\n` +
          "**🔬 Test Indication**\n" +
          `${content.testIndication}\n\n` +
          "**🖼️ Scan Dimension**\n" +
          `${content.selectedDimension}\n\n` +
          "---\n" +
          "**📊 Model Output**\n" +
          `${is2D 
            ? `\n${formatMetrics(data.metrics)}\n\n### Prediction\n${data.tumor_type_predict}` 
            : `**Predicted labels:** ${data.predicted_labels} | **Tumor volume:** ${data.tumor_volume} | **Tumor slices:** ## ${data.tumor_slices}`
          }`,
      });
      
      conversation.push({ sender: "ai", text: aiReply });

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
          setShowModalDelete={setShowModalDelete}
          setShowModalInfo={setShowModalInfo}
          setInteractChat={setInteractChat}
        />

        <div style={{ marginLeft: "200px", padding: "20px", flex: 1, }}>
          <Routes>
            <Route path="/chat/:id" element={<ChatPage chats={chats} setChats={setChats} />} />
            <Route path="/" element={<Introduction />} />
            <Route path="*" element={<Introduction />} />   {/* 👈 catch-all route */}
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

      {showModalDelete && (
        <ModalDelete
          interactChat={interactChat}
          onClose={() => setShowModalDelete(false)}
          onSubmit={(topic, content) => {
            setShowModalDelete(false);
            removeChat(interactChat)
          }}
        />
      )}

      {showModalInfo && (
        <ModalInfo
          interactChat={interactChat}
          onClose={() => setShowModalInfo(false)}
          onSubmit={(topic, content) => {
            setShowModalInfo(false);
          }}
        />
      )}
    </>
  );
}
