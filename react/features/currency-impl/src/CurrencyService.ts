import { ICurrencyService, type IConversionResult, type CurrencyCode } from '@gaev/currency-contract';

const rates: Record<string, number> = {
  'USD-EUR': 0.92, 'USD-GBP': 0.79, 'USD-JPY': 157.5,
  'EUR-USD': 1.09, 'EUR-GBP': 0.86, 'EUR-JPY': 171.3,
  'GBP-USD': 1.27, 'GBP-EUR': 1.17, 'GBP-JPY': 199.2,
  'JPY-USD': 0.0063, 'JPY-EUR': 0.0058, 'JPY-GBP': 0.005,
};

export class CurrencyService extends ICurrencyService {
  async convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<IConversionResult> {
    const key = `${from}-${to}`;
    const rate = from === to ? 1 : (rates[key] ?? 1);
    return { from, to, amount, result: amount * rate, rate };
  }
}
