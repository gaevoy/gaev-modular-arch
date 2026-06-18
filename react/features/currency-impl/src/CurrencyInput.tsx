import { useState, useEffect } from 'react';
import { container } from '@gaev/container';
import { CURRENCY_SERVICE, type ICurrencyService, type IConversionResult, type CurrencyCode } from '@gaev/currency-contract';
import type { CurrencyInputProps } from '@gaev/currency-contract';

const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY'];

export default function CurrencyInput({ defaultAmount = 100 }: CurrencyInputProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [from, setFrom] = useState<CurrencyCode>('USD');
  const [to, setTo] = useState<CurrencyCode>('EUR');
  const [result, setResult] = useState<IConversionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const service = container.get<ICurrencyService>(CURRENCY_SERVICE);
    service.convert(amount, from, to).then(r => { if (!cancelled) setResult(r); });
    return () => { cancelled = true; };
  }, [amount, from, to]);

  return (
    <div>
      <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
      <select value={from} onChange={e => setFrom(e.target.value as CurrencyCode)}>
        {currencies.map(c => <option key={c}>{c}</option>)}
      </select>
      <span> → </span>
      <select value={to} onChange={e => setTo(e.target.value as CurrencyCode)}>
        {currencies.map(c => <option key={c}>{c}</option>)}
      </select>
      {result ? <span> = {result.result.toFixed(2)} {to}</span> : <span> …</span>}
    </div>
  );
}
