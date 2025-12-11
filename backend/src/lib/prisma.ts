import { PrismaClient } from '@prisma/client';

// Singleton pattern для PrismaClient
// Предотвращает создание множества соединений с БД
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Обработка graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

