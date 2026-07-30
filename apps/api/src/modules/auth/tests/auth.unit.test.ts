import { describe, it, expect } from 'vitest';
import { registerSchema } from '../schemas/register.schema.js';

describe('register schema', () => {
  it('accepts valid payload', () => {
    const payload = {
      organizationName: 'SmartShop Demo Ltd.',
      ownerFirstName: 'Alex',
      ownerLastName: 'Kiprop',
      ownerEmail: 'alex@smartshop.test',
      ownerPhone: '+254700000001',
      password: 'StrongPassword123!',
    };

    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const payload = {
      organizationName: 'SmartShop Demo Ltd.',
      ownerFirstName: 'Alex',
      ownerLastName: 'Kiprop',
      ownerEmail: 'alex@smartshop.test',
      ownerPhone: '+254700000001',
      password: 'weak',
    };

    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
