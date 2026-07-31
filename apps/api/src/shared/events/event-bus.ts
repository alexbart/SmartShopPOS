import { randomUUID } from 'node:crypto';

export interface DomainEvent {
  id: string;
  occurredAt: Date;
}

export abstract class DomainEventBase implements DomainEvent {
  id: string;
  occurredAt: Date;

  constructor() {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }
}

// eslint-disable-next-line no-unused-vars
export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void;

export interface EventBus {
  // eslint-disable-next-line no-unused-vars
  publish<T extends DomainEvent>(event: T): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
}

export class InMemoryEventBus implements EventBus {
  private readonly _handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map();

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.constructor.name;
    const handlers = this._handlers.get(eventType);

    if (!handlers) return;

    for (const handler of handlers) {
      await handler(event);
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, new Set());
    }
    this._handlers.get(eventType)!.add(handler as EventHandler<DomainEvent>);
  }
}
