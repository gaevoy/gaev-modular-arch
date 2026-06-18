import type { IConversionResult, CurrencyCode } from './IConversionResult';
export abstract class ICurrencyService { abstract convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<IConversionResult>; }
export const CURRENCY_SERVICE = Symbol.for('@gaev/currency/CURRENCY_SERVICE');
