import "./arrow.css";
import { useState, useEffect, useRef } from "react";

function Show2DImage({setShowImage, imageFiles}) {
    
    console.log("in Show2DImage : ")
    console.log(imageFiles)
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const currentImage = imageFiles?.[currentImageIndex];

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };
    
    const handleNext = () => {
    setCurrentImageIndex((prev) =>
        prev < imageFiles.length - 1 ? prev + 1 : prev
    )};      
    
    // for input select image by input num
    const [imageInput, setImageInput] = useState(currentImageIndex + 1);
    useEffect(() => {
        setImageInput(currentImageIndex + 1);
    }, [currentImageIndex]);  


    const styles = {
        fixedContainer: {
            position: "relative",
            left: "40px",
            // left: "49px",
            marginLeft: "49%",
            transform: "translateX(-50%)",
            width: "90%",          // responsive width
            maxWidth: "1000px",    // max width so it doesn't get too big on big screens
            background: "white",
            padding: "10px",
            zIndex: 999,
            textAlign: "center",
        },
        image: {
            maxWidth: "400px",
            height: "auto",
            borderRadius: "8px",
            marginBottom: "8px",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            opacity: 1,
        },    
        arrow: {
            position: "absolute",
            cursor: "pointer",
            left: "48%",
            fontSize: "20px",
        },
        toggleButton: {
            position: "fixed",
            left: "57%",
            cursor: "pointer",
            zIndex: 998,
        },
        imageNavArrow: {
            cursor: "pointer",
            fontSize: "24px",
            padding: "0 12px",
            userSelect: "none",
            color: "#333",
        },
        imageNavContainer: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
    }};
    
    return (
        <div style={styles.fixedContainer}>
            <div style={styles.imageNavContainer}>
                {/* Left Arrow */}
                <div onClick={handlePrev}>
                    <div className="arrow left" />
                </div>
    
                {/* Image */}
                {currentImage && (
                    <img
                    src={currentImage.url}
                    alt={`Image ${currentImageIndex + 1}`}
                    style={styles.image}
                    className="fade-in" 
                    />
                )}
    
                {/* Right Arrow */}
                <div onClick={handleNext}>
                    <div className="arrow right" />
                </div>
            </div>
    
                {/* Image Counter */}
                <div style={styles.counterText}>
                    {currentImageIndex + 1} / {imageFiles.length}
                </div>
    
            {/* Hide viewer */}
            <div
                style={styles.arrow}
                className="arrow left"
                onClick={() => setShowImage(false)}
            />
      </div>
    );
}

export default Show2DImage;