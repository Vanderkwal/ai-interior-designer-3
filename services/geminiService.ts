
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedQuestion, QuestionType } from "../types";

const SYSTEM_INSTRUCTION = `
ROL:
Jij bent de Senior Data-Specialist voor ANS en Toetsdeskundige. Jouw enige doel is: Foutloze Conversie en Validatie naar een technisch perfecte ANS CSV (34 kolommen).

TAAK 1: ANTI-TESTWISENESS & KWALITEIT
1. Gelijke Lengte: Herschrijf de afleiders (distractors) zodat ze visueel en qua tekstlengte nagenoeg identiek zijn aan het juiste antwoord.
2. DE-DUPLICATIE (CRUCIAAL): De tekst van het juiste antwoord mag NOOIT herhaald worden in de afleiders. Verwijder of verander dubbele keuzes onmiddellijk.
3. Duidelijkheid: Gebruik eenduidige vraagstelling zonder dubbele negaties.

TAAK 2: SANITIZATION
- Verwijder alle enters (\\n) in de tekst; gebruik <br> voor noodzakelijke witregels.
- Vervang alle dubbele quotes (") door enkele quotes (').
- Vervang alle puntkomma's (;) in de tekst door komma's (,).

TAAK 3: TAGGING
- ID: Nummer ze als 'Question 01', 'Question 02', etc.
- Onderwerp: Bepaal een logische tag op basis van de inhoud.
- Bloom: Kies uit [Onthouden, Begrijpen, Toepassen, Analyseren].
- Moeilijkheid: Kies uit [Makkelijk, Gemiddeld, Moeilijk].

TAAK 4: ABSOLUTE VOLLEDIGHEID EN INTEGRITEIT (CRUCIAAL)
- Converteer ABSOLUUT ELKE ingevoerde vraag uit de tekst of het document. Sla NOOIT vragen over.
- Als er 40 of 50 vragen zijn ingevoerd, moeten er EXACT 40 of 50 objecten in de resulterende JSON-array aanwezig zijn. Stop nooit halverwege de lijst.
- Vat de invoer niet samen en maak geen willekeurige selectie of steekproef. Behandel elke vraag systematisch van de eerste tot de allerlaatste.

OUTPUT:
Return een JSON array van objecten. De AI moet de de-duplicatie check intern uitvoeren voordat het resultaat wordt gestuurd.
`;

export const convertContentToQuestions = async (
  inputContent: string,
  inputType: 'text' | 'base64',
  mimeType: string = 'application/pdf'
): Promise<ParsedQuestion[]> => {

  const apiKey = process.env.API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Geen Gemini API Key gevonden. Controleer of je een .env.local bestand hebt aangemaakt met GEMINI_API_KEY.");
  }

  // Initialize Gemini with required telemetry User-Agent
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const model = 'gemini-3.5-flash';

  let contents: any;

  if (inputType === 'text') {
    contents = inputContent;
  } else {
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: inputContent
          }
        },
        {
          text: "Converteer alle ingevoerde vragen naar het gevraagde JSON formaat voor ANS export. Sla geen enkele vraag over, verwerk ze allemaal systematisch van begin tot eind. Pas anti-testwiseness en de-duplicatie strikt toe."
        }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: [QuestionType.MC, QuestionType.ES] },
              questionText: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              distractors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exact 3 unieke afleiders die niet lijken op het juiste antwoord" },
              correctFeedback: { type: Type.STRING },
              modelAnswer: { type: Type.STRING },
              topic: { type: Type.STRING },
              bloom: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["type", "questionText", "topic", "bloom", "difficulty"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    const data = JSON.parse(text);
    
    return data.map((q: any, idx: number) => ({
      ...q,
      id: `Question ${String(idx + 1).padStart(2, '0')}`
    }));

  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    throw new Error("Kon de vragen niet verwerken. Controleer de invoer of het bestand.");
  }
};
