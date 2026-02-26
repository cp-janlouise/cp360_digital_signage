import 'dotenv/config';

console.log('ENV CHECK:', {
  hasUrl: !!process.env.DATABASE_URL,
  value: process.env.DATABASE_URL?.slice(0, 20),
});
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   const result = await prisma.$queryRaw`SELECT NOW()`;
//   console.log(result);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });