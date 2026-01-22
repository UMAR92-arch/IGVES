
import { GoogleGenAI } from "@google/genai";

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
    return "API kaliti topilmadi. Iltimos, sozlamalarni tekshiring.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Using a strong system instruction via the prompt itself for better compliance
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Siz professional moliyaviy tahlilchisiz. Sizning vazifangiz ${asset} aktivi bo'yicha hozirgi bozor holatini tahlil qilishdir.
      
      DIQQAT: FAQAT O'ZBEK TILIDA JAVOB BERING. INGLIZ TILINI ASLO ISHLATMANG.
      
      Javobingizni quyidagi tartibda formatlang:
      
      📌 UMUMIY XULOSA:
      (Bozordagi hozirgi asosiy trend haqida qisqa va aniq ma'lumot)
      
      📊 BOZOR KAYFIYATI:
      (Bullish, Bearish yoki Neutral ekanligini va nima uchunligini tushuntiring)
      
      🎯 MUHIM DARAJALAR:
      (Qo'llab-quvvatlash va qarshilik nuqtalarini ko'rsating)
      
      📰 OXIRGI YANGILIKLAR:
      (Ushbu aktivga ta'sir qilayotgan muhim global voqealar haqida 2-3 ta gap)
      
      Tahlil professional va tushunarli bo'lsin.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Tahlil ma'lumotlari mavjud emas.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "AI tahlilini olishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
  }
};
