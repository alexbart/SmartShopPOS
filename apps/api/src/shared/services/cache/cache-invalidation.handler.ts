import type { CacheService } from '../../../shared/services/cache/cache.service.js';
import {
  SaleCreatedEvent,
  SaleVoidedEvent,
  StockLevelChangedEvent,
} from '../../../shared/events/domain-events.js';
import type { EventBus } from '../../../shared/events/event-bus.js';

export class CacheInvalidationHandler {
  constructor(
    private readonly _cache: CacheService,
    private readonly _eventBus: EventBus,
  ) {}

  subscribe(): void {
    this._eventBus.subscribe(SaleCreatedEvent, (event) => this._onSaleCompleted(event));
    this._eventBus.subscribe(SaleVoidedEvent, (event) => this._onSaleVoided(event));
    this._eventBus.subscribe(StockLevelChangedEvent, (event) => this._onStockChanged(event));
  }

  // eslint-disable-next-line no-unused-vars
  private async _onSaleCompleted(event: SaleCreatedEvent): Promise<void> {
    await this._cache.del(`dashboard:${event.organizationId}`);
    await this._cache.invalidatePattern(`sales:*:${event.organizationId}*`);
    await this._cache.invalidatePattern(`customers:*:${event.organizationId}*`);
  }

  // eslint-disable-next-line no-unused-vars
  private async _onSaleVoided(event: SaleVoidedEvent): Promise<void> {
    await this._cache.del(`dashboard:${event.organizationId}`);
    await this._cache.invalidatePattern(`sales:*:${event.organizationId}*`);
    await this._cache.invalidatePattern(`customers:*:${event.organizationId}*`);
  }

  // eslint-disable-next-line no-unused-vars
  private async _onStockChanged(event: StockLevelChangedEvent): Promise<void> {
    await this._cache.del(`dashboard:${event.organizationId}`);
    await this._cache.invalidatePattern(`inventory:*:${event.organizationId}*`);
  }
}
