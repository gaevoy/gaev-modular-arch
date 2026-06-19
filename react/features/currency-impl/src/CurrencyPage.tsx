import CurrencyInput from './CurrencyInput';

export default function CurrencyPage() {
  return (
    <div>
      <h1>Currency Converter</h1>
      <CurrencyInput defaultAmount={100} />
    </div>
  );
}
