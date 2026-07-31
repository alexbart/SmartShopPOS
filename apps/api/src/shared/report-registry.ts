export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportDefinition<TFilter, TResult> {
  name: string;
  title: string;
  columns: ReportColumn[];
  // eslint-disable-next-line no-unused-vars
  execute(filters: TFilter): Promise<TResult>;
}

export class ReportRegistry {
  private static _instance: ReportRegistry;
  private _reports = new Map<string, ReportDefinition<unknown, unknown>>();

  static getInstance(): ReportRegistry {
    if (!ReportRegistry._instance) {
      ReportRegistry._instance = new ReportRegistry();
    }
    return ReportRegistry._instance;
  }

  register<TFilter, TResult>(report: ReportDefinition<TFilter, TResult>): void {
    this._reports.set(report.name, report as unknown as ReportDefinition<unknown, unknown>);
  }

  get(name: string): ReportDefinition<unknown, unknown> | undefined {
    return this._reports.get(name);
  }

  list(): string[] {
    return Array.from(this._reports.keys());
  }

  // eslint-disable-next-line no-unused-vars
  async execute<TFilter, TResult>(name: string, filters: TFilter): Promise<TResult> {
    const report = this._reports.get(name);
    if (!report) {
      return null as unknown as TResult;
    }
    return report.execute(filters) as Promise<TResult>;
  }

  getReport(name: string): ReportDefinition<unknown, unknown> | null {
    return this._reports.get(name) ?? null;
  }
}

export const reportRegistry = ReportRegistry.getInstance();
