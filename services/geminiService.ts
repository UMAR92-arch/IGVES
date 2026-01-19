
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMarketAnalysis = async (asset: string): Promise<string> => {
  try {
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
    return response.text || "Analysis currently unavailable.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Failed to fetch AI analysis. Please check your API key.";
  }
};
