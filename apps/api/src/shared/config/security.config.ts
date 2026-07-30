export const SecurityConfig = {
  password: {
    minimumLength: 12,
  },
  argon2: {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  },
};
