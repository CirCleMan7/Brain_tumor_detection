import { useEffect } from "react";

export default function PapayaViewer({ images }) {
  useEffect(() => {
    if (!images || images.length === 0 || !window.papaya) return;

    const params = {
      images, // Just pass the array of image URLs
      [images[2]]: { lut: "Red Overlay", alpha: 0.5 }, // Segmentation overlay
      showControlBar: true,
      kioskMode: false
    };

    window.papaya.Container.resetViewer(0, params);
  }, [images]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.papaya && window.papaya.Container) {
        window.papaya.Container.startPapaya();
        clearInterval(interval);
      }
      console.log("eiei");
    }, 200); // check every 200ms
  
    return () => clearInterval(interval);
  }, []);

  return <div className="papaya"></div>;
}
