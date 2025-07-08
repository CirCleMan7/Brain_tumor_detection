import './Introduction.css';

function Introduction() {
    return (
        <div className="introduction-container">
            <div className="introduction-wrapper">
                {/* Main container with gradient border */}
                <div className="main-card">
                    {/* Blue accent line */}
                    <div className="accent-line"></div>
                    
                    <div className="content-wrapper">
                        {/* Header section */}
                        <div className="header-section">
                            <h1 className="main-title">
                                <span className="title-highlight">Brain Tumor</span>
                                <br />
                                <span className="title-secondary">Detection Assistant</span>
                            </h1>
                            
                            {/* Subtitle with modern styling */}
                            <div className="title-divider"></div>
                            
                            <p className="subtitle">
                                Advanced AI-powered platform for medical professionals to analyze brain imaging with precision and intelligence
                            </p>
                        </div>

                        {/* Feature cards */}
                        <div className="feature-grid">
                            <div className="feature-card">
                                <h3 className="feature-title">AI Analysis</h3>
                                <p className="feature-description">
                                    Deep learning models trained on 2D and 3D brain scans for accurate tumor detection
                                </p>
                            </div>
                            
                            <div className="feature-card">
                                <h3 className="feature-title">Multiple Formats</h3>
                                <p className="feature-description">
                                    Support for <code className="file-format">.nii</code>, <code className="file-format">.jpg</code>, <code className="file-format">.npy</code>, and <code className="file-format">.pdf</code> files
                                </p>
                            </div>
                            
                            <div className="feature-card">
                                <h3 className="feature-title">Expert Chatbot</h3>
                                <p className="feature-description">
                                    RAG-based virtual Professor providing medical insights and explanations
                                </p>
                            </div>
                        </div>

                        {/* Main description */}
                        <div className="description-section">
                            <p className="description-text">
                                Upload medical image files and leverage our sophisticated AI models to generate interpretable results. Our system is designed to assist with early tumor identification and provide detailed visualization capabilities.
                            </p>
                            
                            <p className="description-text">
                                Engage with our intelligent chatbot for comprehensive explanations of AI-generated findings, backed by extensive medical knowledge and research.
                            </p>
                        </div>

                        {/* Call to action */}
                        <div className="cta-section">
                            <div className="cta-button">
                                <div className="cta-indicator"></div>
                                <span className="cta-text">Get started by clicking "New Case" on your left</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Bottom accent */}
                <div className="bottom-accent">
                    <div className="accent-content">
                        <div className="accent-line-left"></div>
                        <span className="accent-text">Powered by Advanced AI</span>
                        <div className="accent-line-right"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Introduction;