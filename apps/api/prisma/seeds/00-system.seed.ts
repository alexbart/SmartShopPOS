import { Prisma } from '@prisma/client';

export const systemData = {
  countries: [
    { name: 'Kenya', code: 'KE', currency: 'KES', timezone: 'Africa/Nairobi' },
  ] as Prisma.CountryCreateInput[],
};
