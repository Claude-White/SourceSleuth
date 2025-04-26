// popup.tsx or content.tsx
import React, { useEffect } from "react";
// OR import AdvancedGeminiChat from "./components/AdvancedGeminiChat";

function IndexPopup() {
  useEffect(() => {
    console.log("IndexPopup mounted");
    console.log("API Key available:", !!process.env.PLASMO_PUBLIC_GEMINI_API_KEY);
    if (process.env.PLASMO_PUBLIC_GEMINI_API_KEY) {
      console.log("API Key prefix:", process.env.PLASMO_PUBLIC_GEMINI_API_KEY.substring(0, 6) + "...");
    }
  }, []);

  return (
    <div style={{ width: "400px", height: "500px", padding: "16px" }}>
      <h1>Gemini AI Assistant</h1>
    </div>
  );
}

export default IndexPopup;