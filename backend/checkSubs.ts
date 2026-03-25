const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pushSubscription.findMany().then((s: any[]) => {
  console.log('Push Subscriptions count:', s.length);
  s.forEach((x: any) => console.log(x.userId, x.endpoint.slice(0, 50) + '...'));
  prisma.$disconnect();
});
