import { GoogleGenAI } from "@google/genai";

export interface ItemPayload {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  status: string;
  type: "lost" | "found";
  [key: string]: unknown;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function analyzeReportWithAI(
  report: ItemPayload,
  otherItems: ItemPayload[]
): Promise<unknown> {
  if (!hasApiKey()) {
    console.warn("GEMINI_API_KEY not found. AI analysis will be simulated.");
    return {
      confidence: Math.floor(Math.random() * 40) + 60,
      summary: `This ${report.title} appears to be a ${report.category} item. (Simulated)`,
      potentialMatches: otherItems.slice(0, 2).map((item) => ({
        id: item.id,
        title: item.title,
        matchReason: "Similar category and location description. (Simulated)",
      })),
      recommendation:
        report.status === "found"
          ? "Verify ownership by asking for specific details not mentioned in the report."
          : "Check the Student Union lost and found bin.",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        Analyze the following lost/found report:
        Report: ${JSON.stringify(report)}
        
        Compare it with these other reports:
        Other Reports: ${JSON.stringify(otherItems.filter((i) => i.status !== report.status))}
        
        Provide:
        1. A confidence score (0-100) that this report is legitimate.
        2. A brief summary of the item.
        3. A list of up to 3 potential matches from the other reports.
        4. A recommendation for the next step.
        
        Return the result as a JSON object with keys: "confidence", "summary", "potentialMatches" (array of {id, title, matchReason}), and "recommendation".
        Only return the JSON.
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function chatWithAI(
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  if (!hasApiKey()) {
    return "I'm currently in demo mode. You can report items using the 'Report' button or search using the 'Search' page!";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are the Campus E-Lost and Found virtual assistant. Your goal is to help students recover lost items with a friendly, patient, and campus-centric tone.

GUIDELINES:
- Be concise and break down information into simple, numbered steps.
- Use student-friendly language (e.g., mention the "CSC Office").
- If a student is frustrated, be empathetic.
- ALWAYS end by asking if they need help with anything else.

PROCEDURES YOU MUST KNOW:
1. Reporting Lost Items: Navbar -> 'Report' button -> 'I Lost Something'. Remind them to be descriptive!
2. Claiming Items: Search page -> Find item -> Click 'This is Mine'. They'll need to provide 'Proof of Ownership' (description, photo, or explanation). Admin will manually approve this.
3. Finding an Item: Report it first using 'I Found Something', then bring it to the Campus Security Council (CSC) Office.
4. Tracking: Use your unique Item Reference ID and Verification ID to track the status of your claims.

If you cannot answer a specific query about a certain item's exact location, suggest leaving a comment on the report or waiting for an admin response.`,
      },
    });

    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again or leave a comment on the report.";
  }
}

export async function imageSearchKeywords(imageDataUrl: string): Promise<string> {
  if (!hasApiKey()) {
    return "electronics phone black smartphone";
  }

  const base64Data = imageDataUrl.includes(",")
    ? imageDataUrl.split(",")[1]
    : imageDataUrl;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Analyze this image of a lost item. Provide a list of 5-10 keywords that describe the item, its color, brand, material, and any related categories (e.g., if it's an iPhone, include 'phone', 'electronics', 'apple', 'smartphone', 'black'). Return ONLY the keywords separated by spaces.",
          },
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        ],
      },
    ],
  });

  const keywords = response.text?.trim();
  if (!keywords) {
    throw new Error("Could not analyze image");
  }
  return keywords;
}
