export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface IConversionResult {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;
  rate: number;
}
