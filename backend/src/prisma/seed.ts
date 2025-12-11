import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Создание тестового модератора
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@arendrate.ru' },
    update: {},
    create: {
      email: 'moderator@arendrate.ru',
      name: 'Модератор',
      passwordHash: '$2a$10$rBV2jW2J8Z8Y8Y8Y8Y8Y8e8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y', // password: moderator123
      role: 'MODERATOR',
      dateOfBirth: new Date('1990-01-01'),
    },
  });

  console.log('Created moderator:', moderator);

  // Создание тестового адреса
  const address = await prisma.address.upsert({
    where: {
      country_city_street_building: {
        country: 'Россия',
        city: 'Москва',
        street: 'Тверская улица',
        building: '1',
      },
    },
    update: {},
    create: {
      country: 'Россия',
      city: 'Москва',
      street: 'Тверская улица',
      building: '1',
      latitude: 55.7558,
      longitude: 37.6173,
    },
  });

  console.log('Created address:', address);

  // Создание тестовой квартиры
  const apartment = await prisma.apartment.upsert({
    where: {
      addressId_number: {
        addressId: address.id,
        number: '12',
      },
    },
    update: {},
    create: {
      addressId: address.id,
      number: '12',
    },
  });

  console.log('Created apartment:', apartment);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

