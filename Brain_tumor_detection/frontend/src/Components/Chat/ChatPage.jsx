import { useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import './chat.css'
import './arrow.css'
import ChatInput from './ChatInput'
import PapayaViewerNew from './../PapayaViewerNew'
import Show2DImage from './Show2DImage'
import SlideWrapper from '../Navbar/SlideWrapper'
import NoCaseNotice from './NoCaseNotice'

export default function ChatPage({ chats, setChats }) {
  const { id } = useParams()
  const chat = chats.find((c) => c.id === id)

  // Initialize conversation state with chat conversation if exists
  const [conversation, setConversation] = useState(chat?.conversation || [])
  const [input, setInput] = useState('')
  const [showImage, setShowImage] = useState(false)

  // Update conversation whenever chat changes (like switching chats)
  useEffect(() => {
    setConversation(chat?.conversation || [])
  }, [chat])

  useEffect(() => {
    setShowImage(false)
  }, [chat?.topic])

  useEffect(() => {
    setShowImage(false)
  }, [chat?.content?.selectedDimension])

  const [abortController, setAbortController] = useState(null)

  async function getFlowiseMessage(userPrompt) {
    const controller = new AbortController()
    setAbortController(controller)

    try {
      // await new Promise(r => setTimeout(r, 5000));

      const res = await fetch(
        'https://4xrw8qp1-8000.asse.devtunnels.ms/flowise',
        {
          // const res = await fetch("https://localhost:8000/flowise", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userPrompt }),
          signal: abortController?.signal,
        }
      )

      if (!res.ok) throw new Error('Server error')

      const data = await res.json()
      return data?.reply || 'No response from Gemini'
    } catch (error) {
      if (error.name === 'AbortError') {
        // ✅ Handle cancellation gracefully
        console.log('Fetch was canceled')
        return '❌ AI response canceled by user.' // 👈 Return fallback
      } else {
        console.error('Failed to contact Gemini:', error.message)
        return '❌ Sorry, I couldn’t connect to the AI server.'
      }
    } finally {
      setAbortController(null) // clear it
      chat.process = false
    }
  }

  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    setIsTyping(true)

    const trimmed = input.trim()
    if (!trimmed) return

    // Add user message and typing indicator
    const newMessages = [
      ...conversation,
      { sender: 'user', text: trimmed },
      { sender: 'ai', text: 'typing...', process: true },
    ]
    setConversation(newMessages)
    setInput('')

    // Get AI response
    const aiResponse = await getFlowiseMessage(trimmed)

    // Replace typing with actual AI response
    const updatedMessages = [
      ...newMessages.slice(0, -1),
      { sender: 'ai', text: aiResponse.text },
    ]
    setConversation(updatedMessages)

    // Update global chats state with new conversation
    setChats((prevChats) =>
      prevChats?.map((c) =>
        c.id === chat.id ? { ...c, conversation: updatedMessages } : c
      )
    )

    setIsTyping(false)
  }

  const cancelTyping = () => {
    if (abortController) {
      abortController.abort() // cancel fetch
    }

    setConversation((prev) => prev.filter((msg) => msg.text !== 'typing...'))
    setIsTyping(false)
  }

  const bottomRef = useRef()
  const chatLogRef = useRef()

  // ==============================================================================
  // for auto going down when typing

  const [showScrollButton, setShowScrollButton] = useState(false)

  useEffect(() => {
    const chatLog = chatLogRef.current
    if (!chatLog) return

    const handleScroll = () => {
      const isAtBottom =
        chatLog.scrollHeight - chatLog.scrollTop <= chatLog.clientHeight + 100
      setShowScrollButton(!isAtBottom)
    }

    chatLog.addEventListener('scroll', handleScroll)
    return () => chatLog.removeEventListener('scroll', handleScroll)
  }, [conversation])

  const [viewerParams, setViewerParams] = useState(null)

  const loadExampleImages = () => {
    setViewerParams({
      images: [
        chat.content.viewerImages[0], // base image
        chat.content.viewerImages[2], // overlay image
      ],
      kioskMode: false,
      showControlBar: true,
      smoothDisplay: false,
      // กำหนดพารามิเตอร์ overlay ตามชื่อไฟล์
      [chat.content.viewerImages[2]]: {
        lut: 'Red Overlay',
        alpha: 0.5,
        min: 0,
        max: 3,
      },
    })
  }

  const imageFiles3D =
    chat?.content?.viewerImages?.map((path, i) => ({
      image: path,
      name: `image_${i + 1}`,
    })) || []

  // ==============================================================================
  // for make a scroll page only 2D
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation])

  const styles = {
    image: {
      maxWidth: '400px',
      height: 'auto',
      borderRadius: '8px',
      marginBottom: '8px',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      opacity: 1,
    },
    arrow: {
      position: 'absolute',
      cursor: 'pointer',
      left: '48%',
      fontSize: '20px',
    },
    toggleButton: {
      position: 'absolute',
      left: '-30px',
      top: '40%',
      cursor: 'pointer',
      zIndex: 30,
    },
    imageNavArrow: {
      cursor: 'pointer',
      fontSize: '24px',
      padding: '0 12px',
      userSelect: 'none',
    },
    imageNavContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }

  const [viewerKey, setViewerKey] = useState(0)

  const handleCloseViewer = () => {
    setShowImage(false)
  }

  const handleOpenViewer = () => {
    setViewerKey((prev) => prev + 1) // force remount
    setShowImage(true)
  }

  if (!chat) {
    return <NoCaseNotice />
  }

  return (
    <div className={[`chat-page ${showImage ? 'row-layout' : ''}`].join(' ')}>
      {/* Left: Viewer */}
      <SlideWrapper>
        {
          <div className="viewer-container">
            {chat?.content?.selectedDimension === '2D' ? (
              <Show2DImage
                key={chat.id}
                setShowImage={setShowImage}
                imageFiles={
                  Array.isArray(chat?.content?.viewerImages)
                    ? chat.content.viewerImages.map((url, i) => ({
                        url,
                        name: `image_${i + 1}.png`,
                      }))
                    : []
                }
              />
            ) : (
              <>
                <div>
                  <h1>Brain Tumor Segmentation</h1>
                  <button className="btn" onClick={loadExampleImages}>
                    Predict & Show
                  </button>
                  <PapayaViewerNew viewerParams={viewerParams} />
                </div>
                <div onClick={handleCloseViewer}>
                  <div className="arrow left" />
                </div>
              </>
            )}
          </div>
        }
      </SlideWrapper>
      {/* Right: Chat Section */}
      <div className="chat-container" style={{ flexGrow: 1 }}>
        {!showImage &&
          (chat?.content?.viewerImages?.length > 0 ||
            chat.content.selectedDimension === '3D') && (
            // <div
            //   style={styles.toggleButton}
            //   className="arrow right"
            //   onClick={handleOpenViewer}
            // />

            <div
              style={styles.toggleButton}
              className="arrow right"
              onClick={handleOpenViewer}
            />
            // <div
            //   onClick={handleCloseViewer}
            //   style={{
            //     width: '40px',
            //     height: '100%',
            //     backgroundColor: '#374151',
            //     display: 'flex',
            //     alignItems: 'center',
            //     justifyContent: 'center',
            //     cursor: 'pointer',
            //     transition: 'background-color 0.2s',
            //     position: 'relative'
            //   }}
            //   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            //   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            // ></div>
          )}

        <div key={chat.id} className="chat-log" ref={chatLogRef}>
          {conversation.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'ai' && (
                  <>
                    <img src="/ai-icon.png" className="ai-icon" alt="AI Icon" />
                    <div className="sender-name">AI Brain Expert</div>
                  </>
                )}
                <div className="bubble">
                  {/* <div style={{ display: "flex", alignItems: "center", gap: "8px" }}> */}
                  {/* {msg.process ? (<div className="fade-text text-gray-500"><ReactMarkdown>{msg.text}</ReactMarkdown></div>) : (<ReactMarkdown>{msg.text}</ReactMarkdown>)}
                    {msg.process ? (<div className="loading loading-spinner loading-sm"></div>) : null} */}
                  {/* </div> */}
                  {msg.process ? (
                    <div className="flex items-center gap-2">
                      <div className="fade-text text-gray-500">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      <div className="loading loading-spinner loading-sm"></div>
                    </div>
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isTyping={isTyping}
          cancelTyping={cancelTyping}
          disabled={conversation?.length <= 1}
          chat={chat}
        />
      </div>
    </div>
  )
}
