const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.timeBlock.findMany({
  where: { reminded: false, reminderMinutes: { not: null } }
}).then((b: any[]) => {
  console.log('Unreminded blocks count:', b.length);
  b.forEach(x => console.log('Block ID:', x.id, x.title, x.scheduledDate));
  prisma.$disconnect();
});
