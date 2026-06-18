import { registerBundle } from '@gaev/container';
import { USER_SYMBOLS } from '@gaev/user-contract';
import { CURRENCY_SYMBOLS } from '@gaev/currency-contract';
import { DASHBOARD_SYMBOLS } from '@gaev/dashboard-contract';

export function bootstrap(): void {
  registerBundle(USER_SYMBOLS, () => import('@gaev/user-impl'));
  registerBundle(CURRENCY_SYMBOLS, () => import('@gaev/currency-impl'));
  registerBundle(DASHBOARD_SYMBOLS, () => import('@gaev/dashboard-impl'));
}
