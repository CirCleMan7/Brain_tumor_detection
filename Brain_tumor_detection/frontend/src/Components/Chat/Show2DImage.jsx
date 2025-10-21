import "./arrow.css";
import { useState, useEffect } from "react";

function Show2DImage({ setShowImage, imageFiles }) {
  // Ensure imageFiles is always an array
  const safeImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
  const totalImages = safeImageFiles.length;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = safeImageFiles[currentImageIndex];

  useEffect(() => {
    // Reset index when images change
    setCurrentImageIndex(0);
  }, [safeImageFiles]);

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev < totalImages - 1 ? prev + 1 : prev
    );
  };

  // For input select image by input number (optional)
  const [imageInput, setImageInput] = useState(currentImageIndex + 1);
  useEffect(() => {
    setImageInput(currentImageIndex + 1);
  }, [currentImageIndex]);

  const styles = {
    fixedContainer: {
      position: "relative",
      left: "40px",
      marginLeft: "49%",
      transform: "translateX(-50%)",
      width: "90%", // responsive width
      maxWidth: "1000px", // max width so it doesn't get too big on big screens
      background: "white",
      padding: "10px",
      zIndex: 30,
      textAlign: "center",
      background: "transparent",
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
      zIndex: 30,
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
    },
    counterText: {
      marginTop: "8px",
      fontSize: "14px",
      color: "#666",
    },
  };

  const [images, setImages] = useState([]);

  // useEffect(() => {
  //   Promise.all(
  //     currentImage.url.map((url) =>
  //       fetch(url, {
  //         headers: { "ngrok-skip-browser-warning": "true" },
  //       })
  //         .then((res) => res.blob())
  //         .then((blob) => URL.createObjectURL(blob))
  //     )
  //   ).then(setImages);
  // }, []);
  // // If no images, render a message instead of the viewer
  // if (totalImages === 0) {
  //   return (
  //     <div style={styles.fixedContainer}>
  //       <p>No images to display.</p>
  //       <button onClick={() => setShowImage(false)}>Close Viewer</button>
  //     </div>
  //   );
  // }

  // console.log(currentImage.url)
  console.log("image File", imageFiles)

  return (
    <div style={styles.fixedContainer}>
      <div style={styles.imageNavContainer}>
        {/* Left Arrow */}
        <div onClick={handlePrev} style={{ cursor: currentImageIndex > 0 ? "pointer" : "default", opacity: currentImageIndex > 0 ? 1 : 0.3 }}>
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
        <div onClick={handleNext} style={{ cursor: currentImageIndex < totalImages - 1 ? "pointer" : "default", opacity: currentImageIndex < totalImages - 1 ? 1 : 0.3 }}>
          <div className="arrow right" />
        </div>
      </div>

      {/* Image Counter */}
      <div style={styles.counterText}>
        {currentImageIndex + 1} / {totalImages}
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
