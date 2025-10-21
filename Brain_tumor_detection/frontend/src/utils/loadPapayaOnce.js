let papayaLoaded = false;

export async function loadPapayaOnce() {
  if (papayaLoaded && window.papaya?.Container) return true;

  if (window.papaya) {
    return true;
  }

  // Load papaya.js
  if (!document.querySelector('script[src*="papaya.js"]')) {
    const papayaScript = document.createElement("script");
    papayaScript.src = "/papaya.js";
    document.body.appendChild(papayaScript);
    await new Promise((resolve) => (papayaScript.onload = resolve));
  }

  // Load papaya.css
  if (!document.querySelector('link[href*="papaya.css"]')) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/papaya.css";
    document.head.appendChild(css);
  }

  // Load jQuery (only if needed)
  if (!document.querySelector('script[src*="jquery"]')) {
    const jquery = document.createElement("script");
    jquery.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    document.head.appendChild(jquery);
    await new Promise((resolve) => (jquery.onload = resolve));
  }

  papayaLoaded = true;
  // console.log("✅ Papaya loaded");

  return true;
}
