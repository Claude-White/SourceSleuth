import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import { load } from "cheerio";

// Define types for our responses
interface GeminiResponse {
  summary: string;
  rating: string;
  explanation: string;
  sources: string[];
}

interface WebPage {
  title: string;
  content: string;
  url: string;
}

// Get API keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Check if API keys exist
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
}

if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    throw new Error("Google Search API credentials are not set");
}

const genAi = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize models outside of functions to avoid repeated initialization
// Use gemini-flash for summarization (faster) and gemini-pro for scoring (more accurate)
const flashModel = genAi.getGenerativeModel({
    model: "gemini-2.0-flash", // Fast model for summarization
});

const proModel = genAi.getGenerativeModel({
    model: "gemini-2.5-pro-preview-03-25", // More capable model for analysis and scoring
});

// Function to perform Google search with cached results
const searchCache = new Map<string, any[]>();
async function searchGoogle(query: string, numResults: number = 5): Promise<any[]> {
    // Use cached results if available
    const cacheKey = `${query}:${numResults}`;
    if (searchCache.has(cacheKey)) {
        // @ts-ignore
        return searchCache.get(cacheKey);
    }

    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
            query
        )}&num=${numResults}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        // @ts-ignore
        const results = data.items || [];

        // Cache results
        searchCache.set(cacheKey, results);
        return results;
    } catch (error) {
        console.error("Error searching Google:", error);
        throw error;
    }
}

// Create a cache for web page content
const pageCache = new Map<string, WebPage>();

// Function to fetch and extract content from a webpage with improved efficiency
async function fetchWebPage(url: string): Promise<WebPage> {
    // Use cached page if available
    if (pageCache.has(url)) {
        // @ts-ignore
        return pageCache.get(url);
    }

    try {
        const controller = new AbortController();
        // Set timeout for fetch to avoid waiting too long (reduced from 5000ms to 3500ms)
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // Add proper headers to improve response times and avoid blocking
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; SearchBot/1.0)",
                Accept: "text/html,application/xhtml+xml,application/xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "max-age=0",
            },
            // @ts-ignore
            timeout: 3500, // Additional timeout safeguard
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const html = await response.text();
        // @ts-ignore
        const $ = load(html, { decodeEntities: true });

        // Extract page title
        const title = $("title").text().trim();

        // Skip pages that are likely to be low value based on title
        const lowValueKeywords = [
            "404",
            "not found",
            "access denied",
            "forbidden",
            "login",
        ];
        if (
            lowValueKeywords.some((keyword) =>
                title.toLowerCase().includes(keyword)
            )
        ) {
            throw new Error("Low value page detected");
        }

        // More targeted content extraction - focus on main content areas first
        const contentSelectors = [
            "main article",
            "article",
            "main",
            ".post-content",
            ".article-content",
            "#content",
            ".content",
            ".main",
            '[role="main"]',
            ".entry-content",
            ".post",
            ".blog-post",
        ];

        // Remove non-content elements site-wide before extraction
        $(
            'script, style, nav, footer, header, aside, iframe, .comments, .sidebar, .advertisement, .ads, .navigation, [role="banner"], [role="navigation"], [role="complementary"]'
        ).remove();

        let content = "";
        for (const selector of contentSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                elements.each((_, element) => {
                    content += $(element).text().trim() + " ";
                });

                if (content.trim()) {
                    break; // Stop if we found content
                }
            }
        }

        // Fall back to body text if no specific content area found
        if (!content.trim()) {
            content = $("body").text().trim();
        }

        // Clean up the text more efficiently
        content = content
            .replace(/\s+/g, " ")
            .replace(/\[\d+\]/g, "") // Remove citation markers like [1], [2]
            .trim();

        // Limit content length to avoid token issues (further reduced)
        const MAX_CONTENT_LENGTH = 2000;
        if (content.length > MAX_CONTENT_LENGTH) {
            // Instead of simply truncating, try to keep the most relevant parts
            const firstPart = content.substring(0, MAX_CONTENT_LENGTH * 0.7); // 70% from beginning
            const lastPart = content.substring(
                content.length - MAX_CONTENT_LENGTH * 0.3
            ); // 30% from end
            content = firstPart + "..." + lastPart;
        }

        const pageData = { title, content, url };

        // Cache the page data
        pageCache.set(url, pageData);
        return pageData;
    } catch (error) {
        console.error(`Error fetching webpage ${url}:`, error);
        const errorData = {
            title: "Error",
            content: `Failed to fetch content from ${url}`,
            url,
        };
        // Cache the error result to prevent repeated failing requests
        pageCache.set(url, errorData);
        return errorData;
    }
}

// Function to get web context for a query
async function getWebContext(query: string): Promise<string> {
    try {
        console.log(`Searching for information about: ${query}`);

        const searchResults = await searchGoogle(query);
        if (!searchResults.length) {
            return "No search results found.";
        }

        console.log(`Found ${searchResults.length} search results`);

        // Fetch pages in parallel for better efficiency
        const pagesToFetch = searchResults.slice(0, 3); // Limit to top 3 results
        const fetchPromises = pagesToFetch.map((result) =>
            fetchWebPage(result.link)
        );
        const webPages = await Promise.all(fetchPromises);

        // Format web context more efficiently
        const webPageTexts = webPages.map(
            (page: WebPage, index: number) =>
                `[Source ${index + 1}: ${page.title}] (${page.url})\n${
                    page.content
                }`
        );

        return (
            "### Current Information from Web Search ###\n\n" +
            webPageTexts.join("\n\n")
        );
    } catch (error) {
        console.error("Error getting web context:", error);
        // @ts-ignore
        return `Error retrieving web information: ${error.message}`;
    }
}

// Main function to get Gemini response with web search augmentation
export default async function getGeminiResponse(prompt: string): Promise<GeminiResponse> {
    try {
        // Get web context
        const webContext = await getWebContext(prompt);

        // Step 1: Use gemini-flash for quick summarization of web context
        const summarizationPrompt = `
Summarize the following information related to this query: "${prompt}"

Web search results:
${webContext}

Provide a concise but comprehensive summary of the information found. Include important facts, key points, and cite sources when appropriate.
`;
// @ts-ignore
        const summaryResult = await flashModel.generateContent({
            contents: [{ parts: [{ text: summarizationPrompt }] }],
        });

        const summaryResponse = await summaryResult.response;
        const summary = summaryResponse.text();

        // Extract sources from web context for later use
        const sourceMatches =
            webContext.match(/\[Source \d+: .+?\] \((.+?)\)/g) || [];
        const sources = sourceMatches
            .map((match) => {
                const urlMatch = match.match(/\((.+?)\)/);
                return urlMatch ? urlMatch[1] : "";
            })
            .filter((url) => url);

        // Step 2: Use gemini-pro for accuracy rating and explanation
        const ratingPrompt = `
Based on the following summary about "${prompt}" extracted from web search results:

${summary}

Please provide a rating of the accuracy of the information or statement provided by "${prompt}" on a scale of 1 to 100, where 1 = inaccurate and harmful, and 100 = accurate and helpful. 

Provide a brief explanation of your rating. Take into account the possible biases in the information provided and the potential for misinformation.

Your response should be in JSON format with the following structure only:
{
  "rating": "Your rating here (number between 1-100)",
  "explanation": "Your explanation here"
}`;

// @ts-ignore
        const ratingResult = await proModel.generateContent({
            contents: [{ parts: [{ text: ratingPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const ratingResponse = await ratingResult.response;
        const ratingText = ratingResponse.text();
        let ratingData;

        try {
            ratingData = JSON.parse(ratingText);
        } catch (jsonError: any) {
            console.error("Error parsing rating JSON response:", jsonError);
            ratingData = {
                rating: "N/A",
                explanation: `Error parsing rating response: ${jsonError.message}`,
            };
        }

        // Combine results from both models
        return {
            summary: summary,
            rating: ratingData.rating,
            explanation: ratingData.explanation,
            sources: sources,
        };
    } catch (error: any) {
        console.error("Error generating response:", error);
        return {
            summary: "Error generating response",
            rating: "N/A",
            explanation: `Error: ${error.message}`,
            sources: [],
        };
    }

    // Add a cache management function to prevent memory leaks
    _manageMemoryCaches();
}

// Helper function to manage cache sizes and prevent memory leaks
function _manageMemoryCaches(): void {
    const MAX_CACHE_SIZE = 100; // Maximum entries in each cache

    // Trim search cache if too large
    if (searchCache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(searchCache.keys()).slice(
            0,
            searchCache.size - MAX_CACHE_SIZE
        );
        keysToDelete.forEach((key) => searchCache.delete(key));
    }

    // Trim page cache if too large
    if (pageCache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(pageCache.keys()).slice(
            0,
            pageCache.size - MAX_CACHE_SIZE
        );
        keysToDelete.forEach((key) => pageCache.delete(key));
    }
}