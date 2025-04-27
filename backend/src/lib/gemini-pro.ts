import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { load } from 'cheerio';

// Load environment variables from .env file
dotenv.config();

// Get API keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Check if API keys exist
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
  throw new Error('Google Search API credentials are not set');
}

const genAi = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to list available models
async function listAvailableModels() {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Available models:', data);
    return data;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
}

// Function to perform Google search
async function searchGoogle(query, numResults = 5) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error searching Google:', error);
    throw error;
  }
}

// Function to fetch and extract content from a webpage
async function fetchWebPage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, footer, header, aside, iframe, [role="complementary"], [role="banner"], [role="navigation"]').remove();
    
    // Extract page title
    const title = $('title').text().trim();
    
    // Extract main content (prioritize main content areas)
    let content = '';
    $('main, article, .content, #content, .main').each((_, element) => {
      content += $(element).text().trim() + ' ';
    });
    
    // If no specific content area found, get body text
    if (!content.trim()) {
      content = $('body').text().trim();
    }
    
    // Clean up the text
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit content length to avoid token issues (adjust as needed)
    const MAX_CONTENT_LENGTH = 4000;
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.substring(0, MAX_CONTENT_LENGTH) + '...';
    }
    
    return {
      title,
      content,
      url
    };
  } catch (error) {
    console.error(`Error fetching webpage ${url}:`, error);
    return {
      title: 'Error',
      content: `Failed to fetch content from ${url}`,
      url
    };
  }
}

// Function to get web context for a query
async function getWebContext(query) {
  try {
    console.log(`Searching for information about: ${query}`);
    
    const searchResults = await searchGoogle(query);
    if (!searchResults.length) {
      return "No search results found.";
    }
    
    console.log(`Found ${searchResults.length} search results`);
    
    // Get content from top search results (limit to 3 to avoid token issues)
    const pagesToFetch = searchResults.slice(0, 3);
    const fetchPromises = pagesToFetch.map(result => fetchWebPage(result.link));
    const webPages = await Promise.all(fetchPromises);
    
    // Format web context
    let webContext = "### Current Information from Web Search ###\n\n";
    webPages.forEach((page, index) => {
      webContext += `[Source ${index + 1}: ${page.title}] (${page.url})\n`;
      webContext += `${page.content}\n\n`;
    });
    
    return webContext;
  } catch (error) {
    console.error('Error getting web context:', error);
    return `Error retrieving web information: ${error.message}`;
  }
}

// Main function to get Gemini response with web search augmentation
export default async function getGeminiResponseWithWebSearch(prompt: string) {
  try {
    // Extract search queries from the prompt
    // This is a simple approach - you might want to use Gemini itself to generate better search queries
    const searchQuery = prompt;
    
    // Get web context
    const webContext = await getWebContext(searchQuery);
    
    // Create an augmented prompt that includes web information
    const augmentedPrompt = `
I want you to respond to the following query: "${prompt}"

Here is current information from the web that might be relevant to help you provide an up-to-date response:

${webContext}

Please use this information to provide an accurate and current response. Cite sources when appropriate.
Please provide a rating of the accuracy of the information or statement provided of ${prompt} on a scale of 1 to 100, where 1 = inaccurate and harmful, and 100 = accurate and helpful. Provide a brief explanation of your rating. Take into account the possible biases in the information provided and the potential for misinformation. If you are unable to provide a rating, please explain why.
The sources you return should ONLY be trusted articles that are relevant to the query. Sources like Snopes, Reuters, etc. are great examples of good sources.
Your response should be in JSON format with the following structure:
summary: "Your summary here",
rating: "Your rating here",
explanation: "Your explanation here",
sources: ["source1", "source2", ...]`;

    // Get response from Gemini
    const model = genAi.getGenerativeModel({ 
      model: 'gemini-2.0-flash-001', 
    });

    const result = await model.generateContent({
        contents: [
          {
            parts: [
              {
                text: augmentedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
    const response = await result.response;
    const text = response.text();
    const jsonData = JSON.parse(text);
    return jsonData;

  } catch (error) {
    const errorMessage = `Error generating response: ${error.message}`;
    const jsonData = JSON.parse(errorMessage);
    return jsonData;
  }
}

// Usage example
async function main() {
  const response = await getGeminiResponseWithWebSearch("What is the latest news about AI regulation?");
  console.log(response);
}

// Uncomment to run the example
// main();