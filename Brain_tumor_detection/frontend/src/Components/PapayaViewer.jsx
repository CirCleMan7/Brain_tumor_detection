import { useEffect, useState } from "react";
import { loadPapayaScript } from "../utils/loadPapaya";

export default function PapayaViewer() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPapayaScript()
      .then(() => {
        if (document.querySelector(".papaya")) {
          window.papaya.Container.startPapaya();
          setLoaded(true);
        } else {
          console.warn("Papaya div not found");
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="papaya" style={{ width: 800, height: 600, margin: "auto" }} />
      {!loaded && <p>Loading Papaya...</p>}
    </div>
  );
}
