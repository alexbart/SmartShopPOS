export class Quantity {
  private readonly _value: number;

  constructor(value: number) {
    if (!Number.isFinite(value)) {
      throw new Error('Quantity must be a finite number');
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this._value + other._value);
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this._value - other._value);
  }

  greaterThan(other: Quantity): boolean {
    return this._value > other._value;
  }

  isNegative(): boolean {
    return this._value < 0;
  }

  isZero(): boolean {
    return this._value === 0;
  }

  isPositive(): boolean {
    return this._value > 0;
  }

  toString(): string {
    return String(this._value);
  }

  toJSON(): number {
    return this._value;
  }
}
