import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Helper function to safely parse Gemini JSON responses
function parseGeminiJsonResponse(text: string): any {
  if (!text) {
    throw new Error("Empty response received from AI model.");
  }

  let cleaned = text.trim();

  // Strip markdown code block wrappers if present
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  }

  // Attempt direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt regex extraction of JSON object { ... }
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        // Fall through
      }
    }
    throw new Error("The AI model response could not be parsed as JSON. Please try generating again.");
  }
}

const FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-2.5-flash"];

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} attempt failed:`, err?.message || err);
      lastError = err;
      const errMsg = String(err?.message || err || "");
      if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("403")) {
        throw new Error("Gemini API Key Permission Denied (403). Please verify your GEMINI_API_KEY environment variable.");
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const errMsg = String(lastError?.message || lastError || "");
  if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("demand")) {
    throw new Error("The AI service is currently experiencing high demand. Please try again in a few moments.");
  }
  if (errMsg.includes("PERMISSION_DENIED") || errMsg.includes("403")) {
    throw new Error("Gemini API Key Permission Denied (403). Please verify your GEMINI_API_KEY environment variable.");
  }
  throw lastError || new Error("Failed to generate content from AI model.");
}

// Endpoint to generate itineraries
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, days, interests } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ error: "Destination and days are required." });
    }

    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 10) {
      return res.status(400).json({ error: "Days must be a number between 1 and 10." });
    }

    const ai = getAIClient();
    
    const promptText = `
      You are an expert travel planner. Create a highly detailed and customized day-by-day travel itinerary for the following request:
      - Destination: ${destination}
      - Duration: ${parsedDays} days
      - Interests: ${interests || "General sightseeing, local food, culture, highlights"}

      You MUST respond with a JSON object that matches this TypeScript schema exactly:
      {
        "destination": string, // Normalized destination name (e.g. "Paris, France")
        "lat": number, // Latitude of the destination city (e.g. 48.8566)
        "lng": number, // Longitude of the destination city (e.g. 2.3522)
        "summary": string, // A short, welcoming description or intro for the trip
        "days": [
          {
            "dayNumber": number, // starting from 1
            "foodTip": string, // A local food recommendation or tip for this day (specific restaurant or dish name)
            "morning": {
              "title": string, // Short title of morning activity
              "description": string, // Clear, exciting description of what to do and why
              "locationName": string, // Specific landmark, museum, or spot name
              "latitude": number, // Estimated real latitude of this spot
              "longitude": number // Estimated real longitude of this spot
            },
            "afternoon": {
              "title": string,
              "description": string,
              "locationName": string,
              "latitude": number,
              "longitude": number
            },
            "evening": {
              "title": string,
              "description": string,
              "locationName": string,
              "latitude": number,
              "longitude": number
            }
          }
        ]
      }

      Provide accurate and realistic coordinates for the destination and all individual attractions so that we can plot them on an interactive map.
      Only return valid JSON. Do not include any markdown styling like \`\`\`json outside of it, and do not include extra explanations.
    `;

    const response = await generateWithFallback(ai, {
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini.");
    }

    const parsedData = parseGeminiJsonResponse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    res.status(500).json({ error: error.message || "Failed to generate itinerary. Please try again." });
  }
});

// Endpoint for the contextual travel companion chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, activeItinerary } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAIClient();

    // Map frontend messages to Gemini API content format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || "" }]
    }));

    // Generate contextual system instruction using the active itinerary if available
    let systemInstruction = "You are WanderAI's expert travel companion and assistant. Help the user plan, customize, explore, and answer any travel-related questions warmly, clearly, and concisely.";
    if (activeItinerary) {
      systemInstruction += `\n\nThe user is currently viewing/planning a trip to: ${activeItinerary.destination}.
Here are some details about their active itinerary:
- Duration: ${activeItinerary.days ? activeItinerary.days.length : 0} days
- Summary: ${activeItinerary.summary || ""}
Feel free to reference their activities, local tips, and destination in your replies. Keep your advice highly relevant to their trip, suggesting packing advice, cultural norms, dining options, or modifications to this itinerary if asked.`;
    }

    const response = await generateWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini.");
    }

    res.json({ content: responseText });
  } catch (error: any) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to process chat. Please try again." });
  }
});

// Setup Vite Dev Server / Static files middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
