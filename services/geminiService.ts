
import { GoogleGenAI, Type } from "@google/genai";

// Safe access to process.env to prevent crashes on Vercel/Browsers
const getApiKey = () => {
  try {
    return process?.env?.API_KEY || "";
  } catch (e) {
    return "";
  }
};

export const getMarketAnalysis = async (asset: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "API Key topilmadi. Iltimos, loyiha sozlamalarida API_KEY ni o'rnating.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the current market sentiment and provide key data for ${asset}. 
      Include:
      1. General summary
      2. Sentiment (Bullish/Bearish)
      3. Important support/resistance levels
      4. Recent news affecting this asset.
      Format the response in clear, concise professional trading language.`,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Tahlil ma'lumotlari mavjud emas.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "AI tahlilini olishda xatolik yuz berdi. API kalitini tekshiring.";
  }
};
