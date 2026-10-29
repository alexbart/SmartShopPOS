export type FeatureKey = keyof typeof DEFAULT_FEATURE_FLAGS;

export const DEFAULT_FEATURE_FLAGS = {
  pos: true,
  inventory: true,
  purchasing: true,
  finance: true,
  reporting: true,
  workflow: true,
  loyalty: false,
  ecommerce: false,
  ai: false,
  sms: false,
} as const satisfies Record<string, boolean>;

export type FeatureFlag = typeof DEFAULT_FEATURE_FLAGS;

export function getFeatureFlags(): FeatureFlag {
  const envFlags: Record<string, boolean> = {};

  for (const key of Object.keys(DEFAULT_FEATURE_FLAGS)) {
    const envKey = `FEATURE_${key.toUpperCase()}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      envFlags[key] = envValue === 'true';
    }
  }

  return { ...DEFAULT_FEATURE_FLAGS, ...envFlags };
}
