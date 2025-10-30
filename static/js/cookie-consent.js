// file: static/js/cookie-consent.js
// Simple GDPR-compliant cookie consent banner
// Stores consent in localStorage, no external trackers

(function(){
  const KEY = "consent_accepted";
  
  // Check if consent already given
  try {
    if (localStorage.getItem(KEY) === "1") return;
  } catch(e) { 
    console.warn("localStorage not available");
  }

  // Create consent banner
  const bar = document.createElement("div");
  bar.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: #151a22;
    color: #e9eef5;
    border-top: 1px solid #1e2530;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    z-index: 9999;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
  `;
  
  bar.innerHTML = `
    <span style="flex: 1;">
      🍪 Wir verwenden nur technisch notwendige Cookies für die Funktionalität dieser Website. 
      Keine Tracking-Cookies, keine Analyse-Tools. 
      <a href="/datenschutz" style="color:#36d7b7; text-decoration: underline;">Mehr erfahren</a>
    </span>
    <button id="consent-accept" style="
      background: #36d7b7;
      color: #041317;
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
      Verstanden
    </button>
  `;
  
  document.body.appendChild(bar);
  
  // Handle acceptance
  document.getElementById("consent-accept").addEventListener("click", function(){
    try { 
      localStorage.setItem(KEY, "1"); 
    } catch(e) {
      console.warn("Could not save consent preference");
    }
    bar.style.transition = "opacity 0.3s";
    bar.style.opacity = "0";
    setTimeout(() => bar.remove(), 300);
  });
})();
