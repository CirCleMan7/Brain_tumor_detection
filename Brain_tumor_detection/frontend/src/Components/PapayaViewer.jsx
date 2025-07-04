import { useEffect, useState } from "react";
import { loadPapayaScript } from "../utils/loadPapaya";

export default function PapayaViewer() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPapayaScript()
      .then(() => {
        const papayaDiv = document.querySelector(".papaya");
        if (papayaDiv && window.papaya) {
          window.papaya.Container.startPapaya();
          setLoaded(true);
        }
      })
      .catch(console.error);
  }, []);

  // useEffect(() => {
  //   if (loaded && window.papaya?.Container) {
  //     setTimeout(() => {
  //       window.papaya.Container.resizeViewerComponents();
  //     }, 200);
  //   }
  // }, [loaded]);

  return (
    <div className="viewer-wrapper">
      <div className="papaya" style={{ width: "100%", height: "100%" }} />
      {!loaded && <p>Loading Papaya...</p>}
    </div>
  );
}
