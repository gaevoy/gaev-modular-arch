import { useState, useEffect } from 'react';
import { container } from '@gaev/container';
import {
  CURRENCY_SERVICE,
  type ICurrencyService,
  type IConversionResult,
  type CurrencyCode,
  type UseConversion
} from '@gaev/currency-contract';

export default function useConversion(amount: number, from: CurrencyCode, to: CurrencyCode)
  : ReturnType<UseConversion> {
  const [result, setResult] = useState<IConversionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const service = container.get<ICurrencyService>(CURRENCY_SERVICE);
    service.convert(amount, from, to).then(r => {
      if (!cancelled) { setResult(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [amount, from, to]);

  return { result, loading };
}
