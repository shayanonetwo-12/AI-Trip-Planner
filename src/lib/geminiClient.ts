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

export async function generateItineraryApi(destination: string, days: number, interests: string) {
  let lastApiError: string | null = null;

  // 1. Try server endpoint first (/api/generate-itinerary)
  try {
    const res = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, days, interests }),
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
      return await generateItineraryClientSide(destination, days, interests, clientKey);
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
  apiKey: string
) {
  const ai = new GoogleGenAI({ apiKey });
  const promptText = `
    You are an expert travel planner. Create a highly detailed and customized day-by-day travel itinerary for the following request:
    - Destination: ${destination}
    - Duration: ${days} days
    - Interests: ${interests || "General sightseeing, local food, culture, highlights"}

    You MUST respond with a JSON object that matches this TypeScript schema exactly:
    {
      "destination": string, // Normalized destination name (e.g. "Paris, France")
      "lat": number, // Latitude of the destination city (e.g. 48.8566)
      "lng": number, // Longitude of the destination city (e.g. 2.3522)
      "summary": string, // A short, welcoming description or intro for the trip
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

  let systemInstruction =
    "You are WanderAI's expert travel companion and assistant. Help the user plan, customize, explore, and answer any travel-related questions warmly, clearly, and concisely.";
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

  if (!response.text) {
    throw new Error("No response received from Gemini.");
  }

  return response.text;
}
