import type { IConversionResult, CurrencyCode } from './IConversionResult';
export type UseConversion = (amount: number, from: CurrencyCode, to: CurrencyCode) => { result: IConversionResult | null; loading: boolean };
export const USE_CONVERSION = Symbol.for('@gaev/currency/USE_CONVERSION');
