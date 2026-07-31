export class Money {
  private readonly _amount: number;

  constructor(amount: number | string) {
    this._amount = Number(amount);
    if (Number.isNaN(this._amount)) {
      throw new Error('Invalid money amount');
    }
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  subtract(other: Money): Money {
    return new Money(this._amount - other._amount);
  }

  multiply(factor: number): Money {
    return new Money(this._amount * factor);
  }

  percentage(percent: number): Money {
    return new Money((this._amount * percent) / 100);
  }

  round(decimals: number = 2): Money {
    const factor = Math.pow(10, decimals);
    return new Money(Math.round(this._amount * factor) / factor);
  }

  isGreaterThan(other: Money): boolean {
    return this._amount > other._amount;
  }

  isLessThan(other: Money): boolean {
    return this._amount < other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  isNegative(): boolean {
    return this._amount < 0;
  }

  toString(): string {
    return this._amount.toFixed(2);
  }

  toJSON(): number {
    return this._amount;
  }
}
