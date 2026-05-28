import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// AI Sommelier & Wine Pairing API
app.post("/api/sommelier", async (req, res) => {
  try {
    const { dish, preferences, question } = req.body;

    const systemInstruction = `You are a world-class Head Chef and Sommelier AI at "Oak & Flame", a luxury fine-dining restaurant famous for wood-fired gastronomy, charred flavors, and rare cellar vintage pairings.
Your tone is sophisticated, welcoming, poetic, yet authoritative and concise. Speak like a Michelin-starred concierge.
Focus on explaining why wood-smoke from Oak and Hickory creates distinct flavor compounds, how they harmonize with specific wine acidity/tannins, and the exquisite culinary craft behind our plating.
Always sign off beautifully as "The Sommelier of Oak & Flame". Keep your response limited to 2-3 short, highly structured and beautifully formatted paragraphs using standard Markdown.`;

    let customPrompt = `Please recommend a majestic experience for our guest.\n`;
    if (dish) {
      customPrompt += `The guest is considering the following dish: "${dish}".\n`;
    }
    if (preferences) {
      customPrompt += `The guest has these preferences/allergies: "${preferences}".\n`;
    }
    if (question) {
      customPrompt += `The guest's specific question: "${question}".\n`;
    } else {
      customPrompt += `Recommend a signature fire-charred wood-fired pairing along with a wine cellar recommendation.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: customPrompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to query the Sommelier Concierge. Please try again." });
  }
});

// Setup development dev server or serve production build
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`Server standing by at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
