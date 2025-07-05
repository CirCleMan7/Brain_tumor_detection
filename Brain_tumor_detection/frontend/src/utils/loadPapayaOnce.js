let papayaPromise = null;

export function loadPapayaOnce() {
  if (papayaPromise) return papayaPromise;

  papayaPromise = new Promise(async (resolve, reject) => {
    // Load jQuery if needed
    if (!window.$) {
      const jqueryScript = document.createElement("script");
      jqueryScript.src = "https://code.jquery.com/jquery-3.6.0.min.js";
      document.body.appendChild(jqueryScript);
      await new Promise((res) => (jqueryScript.onload = res));
    }

    // Only load CSS once
    if (!document.querySelector("link[href='/papaya.css']")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/papaya.css";
      document.head.appendChild(css);
    }

    // Only load papaya.js once
    if (!window.papaya || !window.papaya.Container) {
      const script = document.createElement("script");
      script.src = "/papaya.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject("Failed to load papaya.js");
      document.body.appendChild(script);
    } else {
      resolve();
    }
  });

  return papayaPromise;
}
