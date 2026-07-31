# 0003 — Report Registry Pattern

**Status:** Accepted  
**Date:** 2026-02-10

## Context

The system needs a way to define, register, and export arbitrary reports (sales, inventory, customer, purchase, finance). Different teams own different reports, and a generic export endpoint should be able to discover and execute any registered report.

## Decision

Introduce a `ReportDefinition<TFilter, TResult>` interface with `name`, `title`, `columns`, and `execute(filters)` method. A singleton `ReportRegistry` stores all registered reports. Modules register their reports at startup (typically in a `.registration.ts` file).

### Pattern:
```
export class SalesReportDefinition implements ReportDefinition<SalesFilters, SalesData> {
  name = 'sales';
  columns = [/* ... */];
  async execute(filters: SalesFilters): Promise<SalesData> { ... }
}

// At startup:
reportRegistry.register(new SalesReportDefinition(repository));
```

The `ExportEngine` uses `reportRegistry.get(name)` to execute any registered report by name, supporting CSV/Excel/JSON export without knowing the report internals.

### Alternatives considered:
- **Dedicated endpoint per report** — rejected; creates tight coupling and prevents generic export.
- **Configuration-driven reports** — rejected; too rigid for complex queries.

## Consequences

New reports are added by implementing `ReportDefinition` and calling `reportRegistry.register()`. No changes to the export engine or API layer are needed.
