import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEY_NAMES = [
  'GEMINI_API_KEY_1',
  'GEMINI_API_KEY_2',
  'GEMINI_API_KEY_3',
  'GEMINI_API_KEY_4',
  'GEMINI_API_KEY_5',
];

const DAILY_LIMIT = 20;

export async function getGeminiKey(): Promise<string> {
  const today = new Date().toDateString();

  for (const keyName of KEY_NAMES) {
    const apiKey = process.env[keyName];

    // Skip if this env variable is not set or empty
    if (!apiKey || apiKey.trim() === '') continue;

    // Find or create usage record for this key
    let usage = await prisma.apiKeyUsage.findUnique({
      where: { keyName },
    });

    // Reset if it's a new day
    if (!usage || usage.date !== today) {
      usage = await prisma.apiKeyUsage.upsert({
        where: { keyName },
        update: { count: 0, date: today },
        create: { keyName, count: 0, date: today },
      });
    }

    // Use this key if under limit
    if (usage.count < DAILY_LIMIT) {
      await prisma.apiKeyUsage.update({
        where: { keyName },
        data: { count: { increment: 1 } },
      });
      return apiKey;
    }
  }

  throw new Error('Daily Gemini limit reached across all keys. Resets tomorrow.');
}
