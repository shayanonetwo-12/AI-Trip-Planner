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

export async function generateItineraryApi(
  destination: string,
  days: number,
  interests: string,
  hotelPreference?: string,
  transportPreference?: string,
  currency?: string
) {
  let lastApiError: string | null = null;

  // 1. Try server endpoint first (/api/generate-itinerary)
  try {
    const res = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, days, interests, hotelPreference, transportPreference, currency }),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";
    const isJson = (contentType.includes("application/json") || text.trim().startsWith("{")) && !text.trim().startsWith("<!");

    if (isJson) {
      let data: any = null;
      try {
        data = parseGeminiJsonResponse(text);
      } catch (e: any) {
        if (res.ok) {
          throw new Error("Failed to process server response. Please try again.");
        }
      }

      if (res.ok && data && !data.error) {
        return data;
      }

      if (data && data.error) {
        lastApiError = data.error;
      }
    } else {
      lastApiError = `Server returned status ${res.status}`;
    }
  } catch (err: any) {
    lastApiError = err.message || String(err);
  }

  // 2. Fall back to client-side generation if client key is available
  const clientKey = getClientApiKey();
  if (clientKey) {
    try {
      return await generateItineraryClientSide(
        destination,
        days,
        interests,
        clientKey,
        hotelPreference,
        transportPreference,
        currency
      );
    } catch (clientErr: any) {
      throw clientErr;
    }
  }

  // 3. Throw explicit server error if no client key is available
  if (lastApiError) {
    throw new Error(lastApiError);
  }

  throw new Error(
    "GEMINI_API_KEY environment variable is missing on Vercel.\n\n" +
    "To fix this in Vercel:\n" +
    "1. Go to your Vercel Project Dashboard -> Settings -> Environment Variables.\n" +
    "2. Add 'GEMINI_API_KEY' (and/or 'VITE_GEMINI_API_KEY') with your Gemini API key from Google AI Studio.\n" +
    "3. Go to the Deployments tab and click 'Redeploy'."
  );
}

export async function chatApi(messages: any[], activeItinerary: any) {
  let lastApiError: string | null = null;

  // 1. Try server endpoint first (/api/chat)
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, activeItinerary }),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";
    const isJson = (contentType.includes("application/json") || text.trim().startsWith("{")) && !text.trim().startsWith("<!");

    if (isJson) {
      let data: any = null;
      try {
        data = parseGeminiJsonResponse(text);
      } catch (e: any) {
        if (res.ok) {
          throw new Error("Failed to process chat response. Please try again.");
        }
      }

      if (res.ok && data && data.content) {
        return data.content;
      }

      if (data && data.error) {
        lastApiError = data.error;
      }
    } else {
      lastApiError = `Server returned status ${res.status}`;
    }
  } catch (err: any) {
    lastApiError = err.message || String(err);
  }

  // 2. Fall back to client-side generation if client key is available
  const clientKey = getClientApiKey();
  if (clientKey) {
    try {
      return await chatClientSide(messages, activeItinerary, clientKey);
    } catch (clientErr: any) {
      throw clientErr;
    }
  }

  // 3. Throw explicit server error if no client key is available
  if (lastApiError) {
    throw new Error(lastApiError);
  }

  throw new Error(
    "GEMINI_API_KEY is missing on Vercel. Please add GEMINI_API_KEY in Vercel Settings -> Environment Variables and redeploy."
  );
}

function getClientApiKey(): string | undefined {
  const metaEnv = (import.meta as any).env || {};
  return (
    metaEnv.VITE_GEMINI_API_KEY ||
    metaEnv.GEMINI_API_KEY ||
    (typeof process !== "undefined" && process.env ? process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY : undefined)
  );
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

async function generateItineraryClientSide(
  destination: string,
  days: number,
  interests: string,
  apiKey: string,
  hotelPreference?: string,
  transportPreference?: string,
  currency?: string
) {
  const hotelTierLabel = hotelPreference || "Mid-Range & Comfort";
  const transportModeLabel = transportPreference || "Cabs & Rideshares (Uber / Local Taxis)";
  const userCurrency = currency || "USD";

  const ai = new GoogleGenAI({ apiKey });
  const promptText = `
    You are an expert travel planner and local guide. Create a comprehensive, realistic day-by-day travel itinerary with hotels, weather forecast, cab/transport options, and an ultra-realistic destination-specific budget estimate for:
    - Destination: ${destination}
    - Duration: ${days} days
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
      "destination": string,
      "lat": number,
      "lng": number,
      "summary": string,
      "hotels": [
        {
          "name": string,
          "category": string,
          "estimatedPricePerNight": number,
          "currencySymbol": string,
          "locationArea": string,
          "highlights": string,
          "bookingTip": string
        }
      ],
      "weatherForecast": {
        "temperatureRange": string,
        "condition": string,
        "rainChance": string,
        "bestTimeToVisit": string,
        "packingTips": string[]
      },
      "transportation": {
        "preferredMode": string,
        "estimatedDailyCabCost": number,
        "popularApps": string[],
        "cabFareTips": string,
        "avgTravelTimePerSpot": string
      },
      "budgetBreakdown": {
        "currencyCode": string,
        "currencySymbol": string,
        "estimatedFlightCost": number,
        "hotelCostPerNight": number,
        "hotelCostTotal": number,
        "foodAndDiningPerDay": number,
        "foodAndDiningTotal": number,
        "cabAndTransitPerDay": number,
        "cabAndTransitTotal": number,
        "attractionsAndActivitiesTotal": number,
        "miscellaneousTotal": number,
        "grandTotalEstimated": number,
        "budgetLevel": string,
        "moneySavingTip": string
      },
      "days": [
        {
          "dayNumber": number,
          "foodTip": string,
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

  return parseGeminiJsonResponse(responseText);
}

async function chatClientSide(messages: any[], activeItinerary: any, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const contents = messages.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content || "" }],
  }));

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

  if (!response.text) {
    throw new Error("No response received from Gemini.");
  }

  return response.text;
}
