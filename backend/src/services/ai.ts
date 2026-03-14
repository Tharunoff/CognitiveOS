import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

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

async function callAI(prompt: string): Promise<any> {
  const ai = getNextAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  if (response.text) {
    let cleanText = response.text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/i, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '');
    if (cleanText.endsWith('```')) cleanText = cleanText.replace(/\s*```$/, '');
    return JSON.parse(cleanText);
  }
  return null;
}

// ─── AUTO ROUTING ─────────────────────────────────────────
export async function routeThought(text: string): Promise<{ type: 'Work' | 'Personal'; tags: string[]; confidence: number }> {
  const prompt = `
Analyze this raw text and classify it as either "Work" or "Personal".

Rules:
- Work: startup ideas, product features, business problems, technical projects, professional skills, career moves, side projects with revenue intent, coding projects, SaaS ideas, API design, system architecture
- Personal: relationships, health, habits, emotions, family, personal goals, travel plans, life milestones, daily reflections, self-improvement without commercial intent, fitness, meditation, journaling

Also extract 2-4 tags that describe the content.

Return JSON: { "type": "Work" or "Personal", "tags": ["string"], "confidence": number between 0.0 and 1.0 }

Text:
${text}
`;
  try {
    const result = await callAI(prompt);
    return {
      type: result?.type === 'Personal' ? 'Personal' : 'Work',
      tags: Array.isArray(result?.tags) ? result.tags : [],
      confidence: typeof result?.confidence === 'number' ? result.confidence : 0.8
    };
  } catch {
    return { type: 'Work', tags: [], confidence: 0.5 };
  }
}

// ─── WORK IDEA STRUCTURING ────────────────────────────────
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

// ─── PERSONAL IDEA STRUCTURING (REDESIGNED) ───────────────
const IDEA_PROMPT_PERSONAL = `
You are a personal life architect. The user has shared a raw thought about their personal life.
Classify and structure it. Return JSON with strictly this schema:

{
  "title": "string — concise name for this thought",
  "core_thought": "string — the essence of what they're expressing",
  "sub_type": "one of: relationship, ritual, milestone, reflection, health, finance, growth",
  "people_involved": ["string — names or roles of people relevant to this"],
  "emotional_tone": "string — one of: hopeful, anxious, grateful, uncertain, determined, nostalgic, urgent",
  "time_horizon": "string — one of: today, this_week, this_month, this_quarter, this_year, multi_year, ongoing",
  "current_state": "string — where things stand right now",
  "desired_state": "string — where the user wants to be",
  "next_small_step": "string — the single smallest action that moves this forward",
  "potential_blockers": ["string — what could prevent progress"],
  "related_life_areas": ["string — e.g. career, family, health, finance, social, spiritual"],
  "reflection_prompt": "string — a question that helps the user think deeper about this"
}

Personal thought:
`;

export async function structureIdea(text: string, type: 'Work' | 'Personal' = 'Work') {
  try {
    const prompt = type === 'Personal' ? IDEA_PROMPT_PERSONAL : IDEA_PROMPT_WORK;
    return await callAI(prompt + text);
  } catch (error) {
    console.error("Error generating structured idea:", error);
    throw new Error("Failed to process idea with Gemini.");
  }
}

// ─── LEARNING COMPRESSOR ──────────────────────────────────
const LEARNING_PROMPT = `
Explain the topic in four formats. If the topic involves programming or is technical, MUST use Markdown code blocks with the correct language identifier for code snippets.
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

export async function compressLearning(topic: string) {
  try {
    return await callAI(LEARNING_PROMPT + topic);
  } catch (error) {
    console.error("Error generating learning compression:", error);
    throw new Error("Failed to process learning topic with Gemini.");
  }
}

// ─── AI EDIT IDEA ─────────────────────────────────────────
export async function editIdeaWithAI(currentIdeaJson: any, instructions: string) {
  const EDIT_PROMPT = `
You are an AI assistant helping a user edit their idea.
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
    return await callAI(EDIT_PROMPT);
  } catch (error) {
    console.error("Error editing idea with Gemini:", error);
    throw new Error("Failed to edit idea with Gemini.");
  }
}

// ─── CONNECTION DETECTION ─────────────────────────────────
export async function detectConnections(newIdea: { id: string; title: string; problem: string }, existingIdeas: { id: string; title: string; problem: string }[]) {
  if (existingIdeas.length === 0) return [];
  const prompt = `
Given this new idea and these existing ideas, identify meaningful connections.

New idea: "${newIdea.title}": ${newIdea.problem}

Existing ideas:
${existingIdeas.map(i => `- [${i.id}] "${i.title}": ${i.problem}`).join('\n')}

For each connection found, return:
{
  "connections": [
    {
      "target_id": "string — must be one of the existing idea IDs listed above",
      "link_type": "one of: evolves_from, contradicts, supports, depends_on, related",
      "reason": "string — one sentence explaining the connection"
    }
  ]
}

Only return connections with genuine conceptual overlap. Do not force connections.
Return empty connections array if no real connections exist.
`;
  try {
    const result = await callAI(prompt);
    return Array.isArray(result?.connections) ? result.connections : [];
  } catch {
    return [];
  }
}

// ─── CONTRADICTION DETECTOR ───────────────────────────────
export async function detectContradictions(newIdea: { title: string; problem: string; sections: any[] }, existingIdeas: { id: string; title: string; problem: string }[]) {
  if (existingIdeas.length === 0) return [];
  const prompt = `
Analyze this idea against the user's existing ideas and identify contradictions.

A contradiction exists when:
- The user states something in one idea that directly opposes another
- Two ideas have incompatible assumptions or goals
- A new decision invalidates a previous plan
- Resource allocation (time, money) conflicts between ideas

New idea: "${newIdea.title}": ${newIdea.problem}

Existing ideas:
${existingIdeas.map(i => `- [${i.id}] "${i.title}": ${i.problem}`).join('\n')}

Return JSON:
{
  "contradictions": [
    {
      "existing_idea_id": "string",
      "existing_idea_title": "string",
      "contradiction_type": "one of: goal_conflict, assumption_conflict, resource_conflict, timeline_conflict",
      "explanation": "string — specific, not vague",
      "suggested_resolution": "string"
    }
  ]
}

Return empty contradictions array if no genuine contradictions exist. Do not manufacture conflicts.
`;
  try {
    const result = await callAI(prompt);
    return Array.isArray(result?.contradictions) ? result.contradictions : [];
  } catch {
    return [];
  }
}

// ─── PATTERN RADAR ────────────────────────────────────────
export async function detectPatterns(ideas: any[], blocks: any[]) {
  const prompt = `
Analyze the user's brain dumps, ideas, and completed blocks.
Identify patterns the user might not see themselves.

Look for:
- Recurring themes (topics that keep appearing)
- Shifting priorities (what was important earlier vs now)
- Unacted-upon intentions (ideas created but never scheduled)
- Blind spots (life areas with zero entries)

Ideas (${ideas.length} total):
${ideas.slice(0, 30).map(i => `- "${i.title}" (${i.type}) created ${i.createdAt} — "${i.problem}"`).join('\n')}

Completed blocks (${blocks.length} total):
${blocks.slice(0, 20).map(b => `- "${b.title}" on ${b.day}`).join('\n')}

Return JSON:
{
  "patterns": [
    {
      "type": "one of: recurring_theme, priority_shift, unacted_intention, blind_spot",
      "title": "string — headline",
      "evidence": "string — specific data points",
      "insight": "string — what this means",
      "suggestion": "string — what to do about it"
    }
  ]
}

Return max 3 patterns. Focus on the most impactful ones.
`;
  try {
    const result = await callAI(prompt);
    return Array.isArray(result?.patterns) ? result.patterns : [];
  } catch {
    return [];
  }
}

// ─── PRE-MORTEM GENERATOR ─────────────────────────────────
export async function generatePreMortem(idea: any) {
  const prompt = `
Imagine it is 6 months from now. This project has FAILED completely.

The project: "${idea.title}"
Goal: ${idea.problem}

Write a post-mortem from the future explaining:
1. The 3 most likely reasons it failed
2. The early warning signs that were ignored
3. The single biggest assumption that turned out to be wrong
4. What the user should validate THIS WEEK before investing more time

Be specific and brutally honest. Avoid generic advice.

Return JSON:
{
  "failure_reasons": [{ "reason": "string", "probability": "high or medium or low", "mitigation": "string" }],
  "warning_signs": ["string"],
  "biggest_assumption": "string",
  "validate_this_week": ["string — specific, actionable"]
}
`;
  try {
    return await callAI(prompt);
  } catch (error) {
    console.error("Error generating pre-mortem:", error);
    throw new Error("Failed to generate pre-mortem.");
  }
}

// ─── WEEKLY MISSION DRAFTER ───────────────────────────────
export async function draftWeeklyMission(activeIdeas: any[], lastWeekBlocks: any[], decayingIdeas: any[]) {
  const prompt = `
Based on the user's active ideas, scheduled blocks, and decaying entries, draft a weekly mission.

Active ideas (${activeIdeas.length}): ${activeIdeas.map(i => `"${i.title}" (${i.type})`).join(', ')}
Last week blocks: ${lastWeekBlocks.length} total, ${lastWeekBlocks.filter((b: any) => b.status === 'COMPLETED').length} completed
Decaying ideas needing attention: ${decayingIdeas.map(i => `"${i.title}"`).join(', ') || 'None'}

Draft a mission with:
1. ONE primary objective for the week (the thing that matters most)
2. 2-3 secondary objectives
3. One "debt payment" task (something neglected that needs revisiting)
4. One personal intention (if relevant)

Keep it to max 5 items total. The user should be able to read this in 15 seconds.

Return JSON:
{
  "primary_mission": { "title": "string", "why": "string" },
  "secondary": [{ "title": "string" }],
  "debt_payment": { "title": "string" },
  "personal_intention": { "title": "string" }
}
`;
  try {
    return await callAI(prompt);
  } catch {
    return null;
  }
}

// ─── MORNING BRIEF ────────────────────────────────────────
export async function generateMorningBrief(data: { todayBlocks: any[]; decayingIdeas: any[]; recentIdeas: any[]; streak: any; totalDeepWorkHours: number }) {
  const prompt = `
Generate a concise, motivating morning brief for a productivity-focused user.

Today's data:
- ${data.todayBlocks.length} focus blocks scheduled: ${data.todayBlocks.map(b => `"${b.title}" at ${b.startTime}`).join(', ') || 'None'}
- ${data.decayingIdeas.length} ideas fading (not touched in 14+ days): ${data.decayingIdeas.map(i => `"${i.title}"`).join(', ') || 'None'}
- Recent ideas this week: ${data.recentIdeas.map(i => `"${i.title}"`).join(', ') || 'None'}
- Current streak: ${data.streak?.currentStreak || 0} days (best: ${data.streak?.longestStreak || 0})
- Deep work hours this week: ${data.totalDeepWorkHours}

Return JSON:
{
  "greeting": "string — short, warm greeting",
  "quote": { "text": "string — an inspiring quote", "author": "string" },
  "primary_focus": "string — the most important thing to do today",
  "fading_alert": "string or null — mention a specific fading idea if any",
  "pattern_insight": "string or null — a brief insight about recent patterns",
  "momentum_summary": "string — one line about streak and deep work"
}

Be concise. No fluff. Every word should earn its place.
`;
  try {
    return await callAI(prompt);
  } catch {
    return {
      greeting: "Good morning.",
      quote: { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
      primary_focus: data.todayBlocks.length > 0 ? `Focus on "${data.todayBlocks[0]?.title}"` : "No blocks scheduled — capture a thought or plan your day.",
      fading_alert: null,
      pattern_insight: null,
      momentum_summary: `${data.streak?.currentStreak || 0}-day streak · ${data.totalDeepWorkHours}h deep work this week`
    };
  }
}

// ─── VAULT CHAT ───────────────────────────────────────────
export async function vaultChat(message: string, ideas: any[]) {
  const prompt = `
You are a thinking partner with access to the user's entire idea vault.
Keep the same tone: calm, direct, analytical.

The user's vault contains these entries:
${ideas.map(i => `[${i.id}] "${i.title}" (${i.type}${i.subType ? '/' + i.subType : ''}) — ${i.problem}`).join('\n')}

The user says: "${message}"

You can:
- Answer questions about their ideas ("What were my health goals?")
- Find patterns ("What themes keep coming up?")
- Suggest connections ("These 3 ideas might be one project")
- Challenge assumptions ("You said X in one idea but Y in another — which is true?")
- Synthesize ("Summarize my thinking on a topic across all entries")

Respond naturally. Reference specific ideas by title when relevant.

Return JSON:
{
  "response": "string — your natural language response",
  "referenced_ideas": ["id1", "id2"]
}
`;
  try {
    return await callAI(prompt);
  } catch {
    return { response: "I couldn't process that. Try rephrasing your question.", referenced_ideas: [] };
  }
}

// ─── EDIT SUMMARY (for revision tracking) ─────────────────
export async function generateEditSummary(before: any, after: any) {
  const prompt = `
Compare these two versions of an idea and generate a one-line summary of what changed.

Before: ${JSON.stringify(before)}
After: ${JSON.stringify(after)}

Return JSON: { "summary": "string — one line describing what changed" }
`;
  try {
    const result = await callAI(prompt);
    return result?.summary || "Updated idea";
  } catch {
    return "Updated idea";
  }
}
