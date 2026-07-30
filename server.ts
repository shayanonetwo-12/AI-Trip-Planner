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
    const { destination, days, interests, hotelPreference, transportPreference, currency } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ error: "Destination and days are required." });
    }

    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 31) {
      return res.status(400).json({ error: "Days must be a number between 1 and 31." });
    }

    const hotelTierLabel = hotelPreference || "Mid-Range & Comfort";
    const transportModeLabel = transportPreference || "Cabs & Rideshares (Uber / Local Taxis)";
    const userCurrency = currency || "USD";

    const ai = getAIClient();
    
    const promptText = `
      You are an expert, highly knowledgeable travel planner and local guide. Create a comprehensive, realistic day-by-day travel itinerary with hotels, weather forecast, cab/transport options, and an ultra-realistic destination-specific budget estimate for:
      - Destination: ${destination}
      - Duration: ${parsedDays} days
      - Selected Interests: ${interests || "General sightseeing, local food, culture, highlights"}
      - Requested Hotel Level: ${hotelTierLabel}
      - Requested Transport Mode: ${transportModeLabel}
      - Preferred Currency: ${userCurrency}

      CRITICAL CURRENCY & BUDGET INSTRUCTIONS:
      1. All prices (hotel cost per night, flight cost, daily food budget, daily cab/transit cost, attractions total, and grand total) MUST be calculated and reported in ${userCurrency}.
      2. Set "currencyCode": "${userCurrency}" and set "currencySymbol" appropriately (e.g. "$" for USD, "€" for EUR, "£" for GBP, "₹" for INR, "¥" for JPY, "C$" for CAD, "A$" for AUD, "AED" for AED).
      3. Tailor all prices specifically to realistic cost standards for ${destination} converted into ${userCurrency}.

      You MUST respond with a JSON object matching this exact schema:
      {
        "destination": string, // Normalized destination city and country (e.g., "Tokyo, Japan")
        "lat": number, // Latitude of destination city center
        "lng": number, // Longitude of destination city center
        "summary": string, // Welcoming overview highlighting the trip theme and local vibes
        
        "hotels": [ // 2 to 3 real, highly recommended hotels/accommodations matching ${hotelTierLabel}
          {
            "name": string, // Hotel or boutique property name
            "category": string, // e.g. "Boutique 4-Star", "Modern Mid-Range", "Luxury Riverside"
            "estimatedPricePerNight": number, // Estimated price per night in ${userCurrency}
            "currencySymbol": string, // Appropriate symbol for ${userCurrency}
            "locationArea": string, // Neighborhood/area (e.g. "Shinjuku, steps from JR Station")
            "highlights": string, // Key features (e.g., "Rooftop terrace, great breakfast, quiet street")
            "bookingTip": string // Insider advice for booking or room selection
          }
        ],

        "weatherForecast": {
          "temperatureRange": string, // e.g., "18°C - 24°C (64°F - 75°F)"
          "condition": string, // e.g., "Mostly sunny with pleasant mild breezes"
          "rainChance": string, // e.g., "15% chance of light passing showers"
          "bestTimeToVisit": string, // e.g., "Spring & Autumn for peak comfortable temperatures"
          "packingTips": string[] // Array of 3-5 specific packing items/clothing items
        },

        "transportation": {
          "preferredMode": string, // e.g., "Cabs & Rideshares (Uber / Grab / Metered Taxis)"
          "estimatedDailyCabCost": number, // Realistic daily cab/rideshare cost in ${userCurrency}
          "popularApps": string[], // List of actual local rideshare/cab apps (e.g. ["Uber", "Grab", "Gojek", "Kakao T", "Bolt", "Local Metered Taxis"])
          "cabFareTips": string, // Specific local cab fare guidance, airport transfer costs, and safety/meter tips
          "avgTravelTimePerSpot": string // Average transit time between itinerary spots (e.g. "15 - 25 mins")
        },

        "budgetBreakdown": { // EXTREMELY REALISTIC destination-based budget calculation in ${userCurrency}
          "currencyCode": string, // "${userCurrency}"
          "currencySymbol": string, // Symbol for ${userCurrency}
          "estimatedFlightCost": number, // Realistic roundtrip airfare estimate per person in ${userCurrency}
          "hotelCostPerNight": number, // Realistic per night hotel cost for ${hotelTierLabel} in ${userCurrency}
          "hotelCostTotal": number, // hotelCostPerNight * ${parsedDays}
          "foodAndDiningPerDay": number, // Realistic daily meal/drink budget per person in ${userCurrency}
          "foodAndDiningTotal": number, // foodAndDiningPerDay * ${parsedDays}
          "cabAndTransitPerDay": number, // Daily cab/taxi/transit fare estimate in ${userCurrency}
          "cabAndTransitTotal": number, // cabAndTransitPerDay * ${parsedDays}
          "attractionsAndActivitiesTotal": number, // Realistic entrance tickets & tour fees for ${parsedDays} days in ${userCurrency}
          "miscellaneousTotal": number, // SIM card, tipping, emergency buffer in ${userCurrency}
          "grandTotalEstimated": number, // Sum of flight + hotelTotal + foodTotal + transitTotal + attractionsTotal + miscTotal
          "budgetLevel": string, // e.g. "Realistic Mid-Range Estimate"
          "moneySavingTip": string // Actionable local money saving trick
        },

        "days": [
          {
            "dayNumber": number,
            "foodTip": string, // Specific restaurant or local food recommendation for this day
            "morning": {
              "title": string,
              "description": string,
              "locationName": string,
              "latitude": number,
              "longitude": number
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
    let systemInstruction = `You are WanderAI's dedicated travel companion and AI assistant. Your sole purpose and area of expertise is travel, trip planning, itinerary creation, destination guides, hotels, local transportation, travel budgeting, weather & packing, food & culture, and travel advice.

CRITICAL DOMAIN RESTRICTION:
- You MUST ONLY answer questions related to travel, destinations, itineraries, hotels, flights/transit, packing, travel budgets, local foods, cultural customs, visas, or trip planning in WanderAI.
- IF A USER ASKS ANYTHING UNRELATED TO TRAVEL (e.g., programming/coding, math, physics, general non-travel trivia, politics, non-travel writing, homework, medical/legal/financial advice, tech support, etc.):
  YOU MUST POLITELY APOLOGIZE AND DECLINE TO ANSWER.
  Example response tone: "I'm sorry, but as WanderAI's dedicated travel assistant, I can only answer travel and trip planning questions! 🌍 I'm unable to assist with that topic, but I'd be happy to help you with your next vacation or any travel-related query."
- Keep all replies warm, polite, clear, and helpful.`;

    if (activeItinerary) {
      systemInstruction += `\n\nCURRENT ACTIVE TRIP CONTEXT:
The user is currently viewing/planning a trip to: ${activeItinerary.destination}.
- Duration: ${activeItinerary.days ? activeItinerary.days.length : 0} days
- Summary: ${activeItinerary.summary || ""}
Feel free to reference their activities, local tips, hotels, transport, and destination in your replies. Keep your advice highly relevant to their trip, suggesting packing advice, cultural norms, dining options, or modifications to this itinerary if asked.`;
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
