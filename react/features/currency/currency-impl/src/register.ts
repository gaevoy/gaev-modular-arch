import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  CURRENCY_SERVICE,
  CURRENCY_INPUT,
  CURRENCY_PAGE,
  USE_CONVERSION,
  type ICurrencyService,
  type CurrencyInputProps,
  type CurrencyPageProps,
  type UseConversion,
} from '@gaev/currency-contract';
import { CurrencyService } from './CurrencyService';
import CurrencyInput from './CurrencyInput';
import useConversion from './useConversion';
import CurrencyPage from './CurrencyPage';

container.bind<ICurrencyService>(CURRENCY_SERVICE).toDynamicValue(() => new CurrencyService());
container.bind<ComponentType<CurrencyInputProps>>(CURRENCY_INPUT).toConstantValue(CurrencyInput);
container.bind<UseConversion>(USE_CONVERSION).toConstantValue(useConversion);
container.bind<ComponentType<CurrencyPageProps>>(CURRENCY_PAGE).toConstantValue(CurrencyPage);
