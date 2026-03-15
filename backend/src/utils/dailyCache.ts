import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export function getTodayKey(): string {
  const now = new Date();
  // Use YYYY-MM-DD format to avoid timezone ambiguity
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function getCached(key: string): Promise<any | null> {
  const today = getTodayKey();
  try {
    const record = await prisma.dailyCache.findUnique({ where: { key } });
    console.log(`[DailyCache] GET key="${key}" storedDate="${record?.date}" today="${today}"`);
    if (!record) return null;
    if (record.date !== today) {
      console.log(`[DailyCache] Cache expired for key="${key}", was=${record.date}, now=${today}`);
      return null;
    }
    return JSON.parse(record.value);
  } catch (e) {
    console.error('[DailyCache] getCached error:', e);
    return null;
  }
}

export async function setCached(key: string, value: any): Promise<void> {
  const today = getTodayKey();
  try {
    await prisma.dailyCache.upsert({
      where: { key },
      update: { value: JSON.stringify(value), date: today },
      create: { key, value: JSON.stringify(value), date: today },
    });
    console.log(`[DailyCache] SET key="${key}" date="${today}"`);
  } catch (e) {
    console.error('[DailyCache] setCached error:', e);
  }
}

export async function clearCached(key: string): Promise<void> {
  try {
    await prisma.dailyCache.delete({ where: { key } });
    console.log(`[DailyCache] CLEARED key="${key}"`);
  } catch (e) {
    // Silent — key may not exist
  }
}
