// const { prisma } = require('../src/modules/infrastructure/prisma.client');
import { prisma } from '../src/modules/infrastructure/prisma.client.js';

async function main() {
  console.log('--- Starting Seeding ---');

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@grabpic.com',
      password_hash: 'hashed_password_123',
      role: 'organizer',
    },
  });

  const attendee = await prisma.user.create({
    data: {
      email: 'attendee@grabpic.com',
      password_hash: 'hashed_password_456',
      role: 'attendee',
    },
  });

  const event = await prisma.event.create({
    data: {
      name: 'Bengaluru Tech Mixer 2026',
      description: 'A networking event for developers in Namma Bengaluru.',
      join_code: 'TECH2026',
      organizer_id: organizer.id,
    },
  });

  console.log({ organizer, attendee, event });
  console.log('--- Seeding Finished ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
