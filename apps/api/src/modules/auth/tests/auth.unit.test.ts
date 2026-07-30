import { describe, it, expect } from 'vitest';
import { registerSchema } from '../schemas/register.schema.js';

describe('register schema', () => {
  it('accepts valid payload', () => {
    const payload = {
      organization: {
        name: 'SmartShop Demo Ltd.',
        code: 'DEMO001',
        email: 'info@smartshop.test',
        phone: '+254700000000',
        kraPin: 'P051234567A',
      },
      owner: {
        firstName: 'Alex',
        lastName: 'Kiprop',
        email: 'alex@smartshop.test',
        phone: '+254700000001',
        password: 'StrongPassword123!',
      },
    };

    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const payload = {
      organization: {
        name: 'SmartShop Demo Ltd.',
        code: 'DEMO001',
        email: 'info@smartshop.test',
        phone: '+254700000000',
        kraPin: 'P051234567A',
      },
      owner: {
        firstName: 'Alex',
        lastName: 'Kiprop',
        email: 'alex@smartshop.test',
        phone: '+254700000001',
        password: 'weak',
      },
    };

    const result = registerSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
