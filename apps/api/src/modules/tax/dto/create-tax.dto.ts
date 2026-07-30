export interface CreateTaxDto {
  name: string;
  code: string;
  description?: string;
  rate: number;
}
