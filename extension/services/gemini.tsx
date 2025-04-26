import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.PLASMO_PUBLIC_GEMINI_API_KEY);

// Get the Gemini model
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro" // You can change this to other models like "gemini-1.5-flash" as needed
});

// Helper function to generate content
export async function generateContent(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

// Helper function for chat conversations
export async function startChat(history = []) {
  const chat = geminiModel.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });
  
  return chat;
}