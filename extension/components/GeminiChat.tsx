// components/GeminiChat.tsx
import React, { useState } from "react";
import { generateContent, startChat } from "../services/gemini";

export default function GeminiChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Function to handle sending messages
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Simple way - just generate a response for a single prompt
      const response = await generateContent(input);
      
      // Add AI response to chat
      setMessages((prev) => [...prev, { role: "model", content: response }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "model", content: "Sorry, there was an error processing your request." }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };
  
  return (
    <div className="gemini-chat">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && <div className="loading">Loading...</div>}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemini something..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}