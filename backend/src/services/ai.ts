import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Load balance between multiple keys if available
const keys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean) as string[];

if (keys.length === 0) {
  console.error("No GEMINI_API_KEY found in environment variables.");
}

let keyIndex = 0;
function getNextAIClient() {
  const key = keys[keyIndex];
  if (!key) throw new Error("No GEMINI_API_KEY available.");
  keyIndex = (keyIndex + 1) % keys.length;
  return new GoogleGenAI({ apiKey: key as string });
}

const IDEA_PROMPT_WORK = `
Organize the following idea.
Return JSON with strictly this schema:
{
  "title": "string",
  "problem": "string",
  "target_users": "string",
  "core_solution": "string",
  "key_features": ["string"],
  "business_model": ["string"],
  "risks": ["string"],
  "open_questions": ["string"]
}
Idea text:
`;

const IDEA_PROMPT_PERSONAL = `
Organize the following idea.
Return JSON with strictly this schema:
{
  "title": "string",
  "problem": "string",
  "target_users": "string",
  "core_solution": "string",
  "key_features": ["string"],
  "business_model": ["string"],
  "risks": ["string"],
  "open_questions": ["string"],
  "ai_suggestions": ["string"]
}
Provide extra creative ideas and suggestions in the "ai_suggestions" array that could enhance this personal project.
Idea text:
`;

const LEARNING_PROMPT = `
Explain the topic in four formats.
Return JSON with strictly this schema:
{
  "kid_explanation": "string",
  "exam_answer": "string",
  "bullet_notes": "string",
  "step_explanation": "string"
}

1. Kid explanation
2. 5 mark exam answer
3. Bullet revision notes
4. Step by step explanation

Topic:
`;

export async function structureIdea(text: string, type: 'Work' | 'Personal' = 'Work') {
  try {
    const ai = getNextAIClient();
    const prompt = type === 'Personal' ? IDEA_PROMPT_PERSONAL : IDEA_PROMPT_WORK;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + text,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error generating structured idea:", error);
    throw new Error("Failed to process idea with Gemini.");
  }
}

export async function compressLearning(topic: string) {
  try {
    const ai = getNextAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: LEARNING_PROMPT + topic,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error generating learning compression:", error);
    throw new Error("Failed to process learning topic with Gemini.");
  }
}

export async function editIdeaWithAI(currentIdeaJson: any, instructions: string) {
  const EDIT_PROMPT = `
You are an AI assistant helping a user edit their startup/project idea.
The user has provided the current JSON structure of their idea and specific instructions on what to change, add, or remove.

Current Idea JSON:
${JSON.stringify(currentIdeaJson, null, 2)}

User Instructions:
${instructions}

Carefully apply the user's instructions to the JSON.
- If the user asks to add something, add it to the relevant array or string.
- If the user asks to remove something, remove it.
- If the user asks to change the focus, rewrite the relevant sections slightly to match the new focus while keeping the rest intact.
- DO NOT change sections that the user did not ask to modify.
- Return the fully updated JSON matching the exact same schema as the input JSON.

Return ONLY valid JSON.
`;

  try {
    const ai = getNextAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: EDIT_PROMPT,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error editing idea with Gemini:", error);
    throw new Error("Failed to edit idea with Gemini.");
  }
}
