import { useEffect, useRef } from "react";
import { loadPapayaOnce } from "../utils/loadPapayaOnce";

export default function PapayaViewer({ viewerParams }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const setupPapaya = async () => {
      await loadPapayaOnce(); // โหลด papaya.js + css

      const papayaDiv = containerRef.current;
      if (!papayaDiv) {
        console.warn("📛 containerRef ยังไม่พร้อม");
        return;
      }

      // สำคัญ! ให้แน่ใจว่า ID ตรงกับ div จริง ๆ
      papayaDiv.id = "papaya-container";

      // Add Viewer
      if (window.papaya?.Container) {
        console.log("✨ เรียก addViewer");
        window.papaya.Container.addViewer("papaya-container", viewerParams);
      } else {
        console.error("❌ Papaya.Container ไม่พร้อม");
      }
    };

    setupPapaya();
  }, [viewerParams]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "600px" }}
    />
  );
}
