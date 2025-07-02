export function loadPapayaScript() {
    return new Promise((resolve, reject) => {
      if (window.papaya && window.papaya.Container) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "/papaya.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load papaya.js"));
      document.body.appendChild(script);
    });
  }
  