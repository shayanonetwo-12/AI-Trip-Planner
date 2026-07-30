import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

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

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { destination, days, interests } = req.body || {};

    if (!destination || !days) {
      return res.status(400).json({ error: "Destination and days are required." });
    }

    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 10) {
      return res.status(400).json({ error: "Days must be a number between 1 and 10." });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing on Vercel. Please add GEMINI_API_KEY in Vercel Project Settings -> Environment Variables and redeploy.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

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
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    return res.status(500).json({ error: error.message || "Failed to generate itinerary. Please try again." });
  }
}
