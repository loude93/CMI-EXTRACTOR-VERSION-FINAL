
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, InvoiceData } from "../types";

export const extractDataFromPdf = async (
  file: File,
  apiKey: string
): Promise<ExtractionResult[]> => {
  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: "Analyze this CMI PDF statement and extract ALL invoices (factures) or summary periods listed. For EACH entry found, extract: 'factureReference' (the reference or period), 'date', 'totalRemise' (Total Remise DH), 'totalCommissionsHT' (Total Commissions HT), 'totalTVASurCommissions' (Total TVA sur Commissions), 'soldeNetRemise' (Solde Net Remise), and 'locationTPE' (Look specifically for 'Location TPE' or 'Frais de location TPE' amount in DH). Return an array of objects."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            factureReference: {
              type: Type.STRING,
              description: "The name, reference number, or ID of the facture/invoice"
            },
            date: {
              type: Type.STRING,
              description: "The date associated with this specific invoice"
            },
            totalRemise: {
              type: Type.NUMBER,
              description: "Total Remise amount in DH"
            },
            totalCommissionsHT: {
              type: Type.NUMBER,
              description: "Total Commissions HT"
            },
            totalTVASurCommissions: {
              type: Type.NUMBER,
              description: "Total TVA sur Commissions"
            },
            soldeNetRemise: {
              type: Type.NUMBER,
              description: "Solde Net Remise"
            },
            locationTPE: {
              type: Type.NUMBER,
              description: "Amount for Location TPE (DH). If not found, return 0."
            }
          },
          required: ["factureReference", "date", "totalRemise", "totalCommissionsHT", "totalTVASurCommissions", "soldeNetRemise", "locationTPE"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const parsed: InvoiceData[] = JSON.parse(text);
  return parsed.map(item => ({
    ...item,
    fileName: file.name
  }));
};
