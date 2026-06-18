import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import { CURRENCY_INPUT, type CurrencyInputProps } from '@gaev/currency-contract';

const CurrencyInput = await resolveAsync<ComponentType<CurrencyInputProps>>(CURRENCY_INPUT);

export default function CurrencyPage() {
  return (
    <div>
      <h1>Currency Converter</h1>
      <CurrencyInput defaultAmount={100} />
    </div>
  );
}
