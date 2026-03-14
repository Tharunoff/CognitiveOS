import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCached(key: string) {
  const dateStr = new Date().toDateString();
  const cached = await prisma.dailyCache.findUnique({
    where: { key }
  });

  if (cached && cached.date === dateStr) {
    try {
      return JSON.parse(cached.value);
    } catch {
      return null;
    }
  }
  return null;
}

export async function setCached(key: string, value: any) {
  const dateStr = new Date().toDateString();
  await prisma.dailyCache.upsert({
    where: { key },
    update: {
      value: JSON.stringify(value),
      date: dateStr
    },
    create: {
      key,
      value: JSON.stringify(value),
      date: dateStr
    }
  });
}
