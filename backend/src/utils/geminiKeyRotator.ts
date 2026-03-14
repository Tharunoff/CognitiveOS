import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();
const MAX_CALLS_PER_DAY = 20;

export async function getGeminiKey(): Promise<string> {
  const today = new Date().toDateString();
  const keys = [
    'GEMINI_API_KEY_1',
    'GEMINI_API_KEY_2',
    'GEMINI_API_KEY_3',
    'GEMINI_API_KEY_4',
    'GEMINI_API_KEY_5'
  ];

  let selectedKeyName: string | null = null;
  let minCount = Infinity;

  for (const keyName of keys) {
    let usage = await prisma.apiKeyUsage.findUnique({
      where: { keyName }
    });

    if (!usage) {
      usage = await prisma.apiKeyUsage.create({
        data: { keyName, count: 0, date: today }
      });
    } else if (usage.date !== today) {
      usage = await prisma.apiKeyUsage.update({
        where: { keyName },
        data: { count: 0, date: today }
      });
    }

    if (usage.count < MAX_CALLS_PER_DAY && usage.count < minCount) {
      minCount = usage.count;
      selectedKeyName = keyName;
    }
  }

  if (!selectedKeyName) {
    throw new Error('Daily Gemini limit reached. Resets tomorrow.');
  }

  // Increment usage for selected key
  await prisma.apiKeyUsage.update({
    where: { keyName: selectedKeyName },
    data: { count: { increment: 1 } }
  });

  return selectedKeyName;
}
