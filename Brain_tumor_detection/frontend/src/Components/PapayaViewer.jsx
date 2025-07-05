import { useEffect, useState } from "react";
import { loadPapayaOnce } from "../utils/loadPapayaOnce";

export default function PapayaViewer({ image = "/your-image.nii.gz"  }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let viewerCheck, fallback;

    const load = async () => {
      await loadPapayaOnce();

      window.papaya = window.papaya || {};
      window.papaya.params = { images: [image] };

      const waitInterval = setInterval(() => {
        const container = document.querySelector(".papaya");
        if (container && window.papaya?.Container?.startPapaya) {
          clearInterval(waitInterval);
          window.papaya.Container.startPapaya();

          viewerCheck = setInterval(() => {
            const viewer = window.papaya?.Container?.viewer?.[0];
            if (viewer && viewer.canvas && viewer.isReady) {
              clearInterval(viewerCheck);
              setLoaded(true);
            }
          }, 200);
        }
      }, 200);

      fallback = setTimeout(() => setLoaded(true), 5000);
    };

    load();

    return () => {
      clearInterval(viewerCheck);
      clearTimeout(fallback);
      if (window.papaya?.Container?.viewer?.length > 0) {
        window.papaya.Container.resetViewer(0, true);
      }
    };
  }, []);


  return (
    <div>
      {!loaded && (
        <div
          style={{
            width: 600,
            height: 600,
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
        <div className="papaya" style={{ display: loaded ? "block" : "none" }} />
      </div>
    </div>
  );
}
