# ADR-006: In-process event bus for domain events

## Status
Accepted

## Context
As the platform grows, multiple modules need to react to domain events (SaleCompleted, PaymentReceived, StockLevelChanged) without creating tight coupling between services.

## Decision
- Use a simple in-process event bus (`InMemoryEventBus`).
- No external message broker (Kafka, RabbitMQ) at this stage.
- `DomainEvent` base class provides `id` and `occurredAt`.
- Modules publish events via `EventBus.publish()` and subscribe via `EventBus.subscribe()`.
- Events are dispatched within the same transaction boundary where possible.

## Consequences
- Loose coupling between domains.
- Easy to add new listeners without modifying publishers.
- Can be replaced with a distributed broker later without changing publisher code.
- Events are lost on process restart — acceptable for non-critical workflows.
