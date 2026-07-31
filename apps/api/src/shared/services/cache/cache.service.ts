import type { Logger } from 'pino';
import redis from 'redis';

export interface CacheService {
  // eslint-disable-next-line no-unused-vars
  get<T>(key: string): Promise<T | null>;
  // eslint-disable-next-line no-unused-vars
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  del(key: string): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  invalidatePattern(pattern: string): Promise<void>;
}

export class NoOpCacheService implements CacheService {
  async get<T>(/* eslint-disable-line no-unused-vars */ _key: string): Promise<T | null> {
    return null;
  }

  async set<T>(
    /* eslint-disable-line no-unused-vars */ _key: string,
    _value: T,
    _ttlSeconds?: number,
  ): Promise<void> {}

  async del(/* eslint-disable-line no-unused-vars */ _key: string): Promise<void> {}

  async invalidatePattern(
    /* eslint-disable-line no-unused-vars */ _pattern: string,
  ): Promise<void> {}
}

export class RedisCacheService implements CacheService {
  private _client: ReturnType<typeof redis.createClient>;
  private _ready: Promise<void>;

  constructor(
    url: string,
    private readonly _logger: Logger,
    private readonly _defaultTtl = 300,
  ) {
    this._client = redis.createClient({ url });
    this._ready = this._connect();
  }

  private async _connect(): Promise<void> {
    await this._client.connect();
    this._logger.info('Redis connected');
  }

  async get<T>(key: string): Promise<T | null> {
    await this._ready;
    const cached = await this._client.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this._ready;
    const ttl = ttlSeconds ?? this._defaultTtl;
    await this._client.setEx(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this._ready;
    await this._client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this._ready;
    const keys = await this._client.keys(pattern);
    if (keys.length > 0) {
      await this._client.del(keys);
    }
  }

  async quit(): Promise<void> {
    await this._ready;
    await this._client.quit();
  }
}
