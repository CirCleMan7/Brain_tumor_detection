import { useEffect, useState, useRef } from "react";
import { loadPapayaOnce } from "../utils/loadPapayaOnce";

const PAPAYA_DIV_ID = "papaya-viewer-main"; 

function resetPapayaViewer(divId) {
  const papaya = window.papaya;
  if (papaya?.Container?.viewer?.length > 0) {
    console.log("🔁 Resetting Papaya viewer...");

    const container = document.getElementById(divId);
    if (container) {
      container.innerHTML = "";
    }

    papaya.Container.viewer = [];
    papaya.Container.resetViewer = function () {};
    window.papayaContainers = [];

    console.log("🧼 Papaya viewer fully cleaned.");
  }
}


export default function PapayaViewer({ images = [] }) {
  useEffect(() => {
    return () => {
      console.log("💨 PapayaViewer unmounting...");
      resetPapayaViewer(PAPAYA_DIV_ID); // Fully clean up when viewer is removed
    };
  }, []);
  const [papayaShellStarted, setPapayaShellStarted] = useState(false);
  const [imagesLoadedIntoViewer, setImagesLoadedIntoViewer] = useState(false);
  const papayaViewerContainerRef = useRef(null);
  
  // Use a ref to ensure resetViewer is called only when needed for new image sets
  const lastImagesRef = useRef([]);

  // IMPORTANT: Assign a consistent ID to the Papaya container.
  // This can be done directly in JSX or dynamically here if you prefer.
  // We'll use a static ID for simplicity and clarity.

  // --- Effect 1: Initialize Papaya Viewer Shell Once ---
  useEffect(() => {
    let timeoutId;
    const startInitialPapayaShell = async () => {
      if (!papayaViewerContainerRef.current) {
        // If ref not ready, retry
        timeoutId = setTimeout(startInitialPapayaShell, 50);
        return;
      }

      // Ensure the ref's current element has the designated ID
      // This is crucial for papaya.Container.startPapaya to correctly target it
      if (papayaViewerContainerRef.current.id !== PAPAYA_DIV_ID) {
          papayaViewerContainerRef.current.id = PAPAYA_DIV_ID;
      }


      try {
        await loadPapayaOnce(); // Ensure jQuery, papaya.js, papaya.css are loaded
        
        // Ensure the papaya object is globally available as the other code expects it
        const papaya = window.papaya;

        if (!papaya || !papaya.Container) {
          console.error("Papaya library not available after loadPapayaOnce.");
          return;
        }

        // Only start the shell if it hasn't been started yet
        if (!papayaShellStarted) {
            console.log("Starting initial Papaya viewer shell...");
            
            // --- MODIFICATION HERE: Pass the div ID to startPapaya ---
            // This tells Papaya exactly which HTML element to initialize its viewer in.
            // If you don't pass an ID, it just picks the first '.papaya' div,
            // but then it's harder to retrieve that specific viewer instance later.
            papaya.Container.startPapaya(PAPAYA_DIV_ID); 
            // --------------------------------------------------------

            setPapayaShellStarted(true); // Mark shell as started
            console.log("✅ Papaya viewer shell initiated for ID:", PAPAYA_DIV_ID);
        } else {
            console.log("Papaya viewer shell already started.");
        }
      } catch (error) {
        console.error("Error starting Papaya initial shell:", error);
      }
    };

    startInitialPapayaShell();

    return () => {
      clearTimeout(timeoutId);
      // No need to reset viewer here for the shell, as it will be reset by the image loading effect
    };
  }, []); // Run this effect ONLY ONCE on component mount

  // --- Effect 2: Load/Update Images using resetViewer ---
  useEffect(() => {
    // Only proceed if the Papaya shell is ready AND images are provided
    if (papayaShellStarted && images && images?.length > 0) {
      // Check if images are actually different to prevent unnecessary resets
      if (JSON.stringify(images) === JSON.stringify(lastImagesRef.current)) {
        console.log("Images are the same, skipping resetViewer.");
        setImagesLoadedIntoViewer(true); // Still consider it loaded if images haven't changed
        return;
      }

      console.log("Loading images into Papaya viewer:", images);
      
      const papaya = window.papaya;

      if (!papaya || !papaya.Container) {
        console.error("Papaya library not available for image loading.");
        setImagesLoadedIntoViewer(false);
        return;
      }

      const viewerParams = {
        images: images,
        kioskMode: false,
        showControlBar: true,
        smoothDisplay: false,
        worldSpace: true,
        overlayOpacity: 0.5,
      };

      try {
        // --- MODIFICATION HERE: Ensure resetViewer uses viewer index or ID ---
        // Assuming this is your first (and only) viewer, index 0 is typically correct.
        // If you were getting a viewer by ID, you might need to adjust this,
        // but `resetViewer(0, params)` works on the viewer at index 0.
        papaya.Container.resetViewer(0, viewerParams); 
        // ------------------------------------------------------------------

        console.log("papaya.Container.resetViewer() called with new images.");
        lastImagesRef.current = images; // Update the ref with the new images

        // --- MODIFICATION HERE: Improved Viewer Instance Check ---
        // The previous "viewer undefined" likely came from trying to get
        // the instance at the wrong time or using a method inconsistent
        // with how it was started.
        // Now that `startPapaya(PAPAYA_DIV_ID)` is used, we can reliably
        // get the viewer by its ID, or by index 0 if it's the first one.
        let imageLoadCheckInterval = setInterval(() => {
            // Get the viewer instance for the specific ID we used
            const viewer = window.papaya?.Container?.getViewer(PAPAYA_DIV_ID);
            // Alternatively, if it's definitely the first viewer:
            // const viewer = window.papaya?.Container?.viewer?.[0];

            if (viewer && viewer.isReady && viewer.imageData && viewer.imageData.images?.length > 0) {
                console.log("✅ Papaya viewer reports images loaded and is ready.");
                clearInterval(imageLoadCheckInterval);
                setImagesLoadedIntoViewer(true);
            } else {
                // This might indicate the viewer isn't ready or images haven't propagated yet
                console.log("Papaya viewer not yet ready or no images loaded internally. Retrying check...");
            }
        }, 300);

        let imageLoadTimeout = setTimeout(() => {
            if (!imagesLoadedIntoViewer) {
                console.warn("⏱️ Papaya image loading timed out (30s) after resetViewer.");
                setImagesLoadedIntoViewer(true); // Force loaded state to unblock UI
            }
        }, 30000);

        return () => {
          clearInterval(imageLoadCheckInterval);
          clearTimeout(imageLoadTimeout);
        };

      } catch (error) {
        console.error("Error setting images in Papaya viewer:", error);
        setImagesLoadedIntoViewer(false);
      }
    } else if (papayaShellStarted && (!images || images?.length === 0)) {
        setImagesLoadedIntoViewer(true);
    }
  }, [papayaShellStarted, images]);

  return (
    <div>
      {/* Show loading spinner if shell hasn't started OR if images are provided but not yet loaded into viewer */}
      {(!papayaShellStarted || (images?.length > 0 && !imagesLoadedIntoViewer)) && (
        <div
          style={{
            width: "600px",
            height: "600px",
            background: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "auto",
            color: "#666",
            fontSize: "1.1rem",
          }}
        >
          🧠 Loading Papaya Viewer...
        </div>
      )}
      <div style={{ padding: 20 }}>
        {/* The Papaya div is always rendered and its visibility controlled */}
        <div
          ref={papayaViewerContainerRef}
          className="papaya"
          id={PAPAYA_DIV_ID} // --- MODIFICATION HERE: Assign the ID to the div ---
          style={{
            visibility: (papayaShellStarted && (!images?.length || imagesLoadedIntoViewer)) ? "visible" : "hidden",
            width: "100%",
            height: "600px", // Crucial for Papaya to render
          }}
        />
      </div>
    </div>
  );
}