// popup.tsx or content.tsx
import React from "react";
import GeminiChat from "./components/GeminiChat";
// OR import AdvancedGeminiChat from "./components/AdvancedGeminiChat";

function IndexPopup() {
  return (
    <div style={{ width: "400px", height: "500px", padding: "16px" }}>
      <h1>Gemini AI Assistant</h1>
      <GeminiChat />
    </div>
  );
}

export default IndexPopup;