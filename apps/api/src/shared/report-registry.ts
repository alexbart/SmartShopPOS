export interface ReportDefinition<TFilter, TResult> {
  name: string;
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

  // eslint-disable-next-line no-unused-vars
  get(name: string): ReportDefinition<unknown, unknown> | undefined {
    return this._reports.get(name);
  }

  list(): string[] {
    return Array.from(this._reports.keys());
  }

  async execute<TFilter, TResult>(name: string, filters: TFilter): Promise<TResult> {
    const report = this._reports.get(name);
    if (!report) {
      throw new Error(`Report '${name}' not found`);
    }
    return report.execute(filters) as Promise<TResult>;
  }
}

export const reportRegistry = ReportRegistry.getInstance();
