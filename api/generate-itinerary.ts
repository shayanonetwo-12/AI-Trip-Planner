import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Helper function to safely parse Gemini JSON responses with auto-repair
function parseGeminiJsonResponse(text: string): any {
  if (!text) {
    throw new Error("Empty response received from AI model.");
  }

  let cleaned = text.trim();

  // Strip markdown code block wrappers if present
  cleaned = cleaned.replace(/^```(?:json)?/gi, "").replace(/```$/g, "").trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/i, "");
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "");
  cleaned = cleaned.trim();

  // Fast path: direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Extract outermost JSON object or array
    let candidate = cleaned;
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidate = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e2) {
        // Continue cleaning candidate
      }
    }

    // Sanitize common LLM syntax defects:
    // 1. Remove JavaScript single-line and multi-line comments
    let sanitized = candidate
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "");

    // 2. Remove trailing commas before } or ]
    sanitized = sanitized.replace(/,(\s*[\}\]])/g, "$1");

    try {
      return JSON.parse(sanitized);
    } catch (e3) {
      // 3. Attempt string quote and brace balancing repair for truncated output
      let repaired = sanitized;
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        repaired += '"';
      }

      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";

      try {
        return JSON.parse(repaired);
      } catch (e4) {
        console.error("Failed to parse Gemini JSON response. Snippet:", text.slice(0, 300));
        throw new Error("The AI model response could not be parsed as JSON. Please try generating again.");
      }
    }
  }
}

const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];

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
    const { destination, days, interests, hotelPreference, transportPreference, currency, targetBudget } = req.body || {};

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
    const userTargetBudget = targetBudget ? String(targetBudget).trim() : null;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing on Vercel. Please add GEMINI_API_KEY in Vercel Project Settings -> Environment Variables and redeploy.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
      You are an expert, highly knowledgeable travel planner and local guide. Create a comprehensive, realistic day-by-day travel itinerary with hotels, weather forecast, cab/transport options, and an ultra-realistic destination-specific budget estimate for:
      - Destination: ${destination}
      - Duration: ${parsedDays} days
      - Selected Interests: ${interests || "General sightseeing, local food, culture, highlights"}
      - Requested Hotel Level: ${hotelTierLabel}
      - Requested Transport Mode: ${transportModeLabel}
      - Preferred Currency: ${userCurrency}
      ${userTargetBudget ? `- TARGET USER MAXIMUM TOTAL BUDGET: ${userTargetBudget} ${userCurrency}` : ""}

      CRITICAL CURRENCY & BUDGET PLANNING INSTRUCTIONS:
      1. All prices across the entire response (including hotel cost per night, flight cost, daily food budget, daily cab and taxi cost in "transportation.estimatedDailyCabCost", attractions total, and grand total) MUST be strictly calculated and reported in ${userCurrency}.
      2. Set "currencyCode": "${userCurrency}" and set "currencySymbol" appropriately (e.g. "$" for USD, "Rs" for PKR, "€" for EUR, "£" for GBP, "₹" for INR, "¥" for JPY, "C$" for CAD, "A$" for AUD, "AED" for AED, "S$" for SGD, "CHF" for CHF).
      3. Tailor all prices (including daily cab fares and accommodation) realistically to local cost standards in ${destination} converted directly to ${userCurrency}.
      ${userTargetBudget ? `4. STRICT BUDGET PLANNING & APOLOGY REQUIREMENT:
      - The user has set a target trip budget constraint of ${userTargetBudget} ${userCurrency}.
      - Try your absolute best to choose hotels, dining, local cabs, and activities so that the total estimated cost (grandTotalEstimated) fits strictly WITHIN or equal to ${userTargetBudget} ${userCurrency}.
      - IF IT IS POSSIBLE to stay within ${userTargetBudget} ${userCurrency}, start the "summary" string with a brief confirmation note, e.g.: "Great news! We have successfully crafted your entire ${parsedDays}-day itinerary for ${destination} strictly within your budget of ${userTargetBudget} ${userCurrency}."
      - IF IT IS NOT POSSIBLE to fit within ${userTargetBudget} ${userCurrency} due to high baseline market prices (e.g. flight or hotel costs in ${destination}), plan the itinerary as close/near to ${userTargetBudget} ${userCurrency} as possible, AND YOU MUST INCLUDE AN EXPLICIT APOLOGY LINE at the start of the "summary" string, e.g.: "We sincerely apologize, but due to baseline market costs in ${destination}, we couldn't keep the total trip under ${userTargetBudget} ${userCurrency}. We have planned the closest possible budget-friendly itinerary at [estimated total] ${userCurrency} without compromising your safety and experience."` : ""}

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
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    return res.status(500).json({ error: error.message || "Failed to generate itinerary. Please try again." });
  }
}
