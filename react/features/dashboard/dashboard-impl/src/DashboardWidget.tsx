import React, { useState, useEffect, type ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import {
  USER_AVATAR,
  USER_SERVICE,
  type UserAvatarProps,
  type IUserService,
  type IUser
} from '@gaev/user-contract';
import {
  CURRENCY_SERVICE,
  type ICurrencyService,
  type IConversionResult
} from '@gaev/currency-contract';
import type { DashboardWidgetProps } from '@gaev/dashboard-contract';

const [UserAvatar, userService, currencyService] = await Promise.all([
  resolveAsync<ComponentType<UserAvatarProps>>(USER_AVATAR),
  resolveAsync<IUserService>(USER_SERVICE),
  resolveAsync<ICurrencyService>(CURRENCY_SERVICE),
]);

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ defaultAmount = 100 }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [conversion, setConversion] = useState<IConversionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userService.getCurrentUser(),
      currencyService.convert(defaultAmount, 'USD', 'EUR'),
    ]).then(([u, conv]) => {
      if (!cancelled) { setUser(u); setConversion(conv); }
    });
    return () => { cancelled = true; };
  }, [defaultAmount]);

  if (!user || !conversion) return <p>Loading data…</p>;

  return (
    <div>
      <UserAvatar userId={user.id} size="md" />
      <h2>Welcome, {user.name}</h2>
      <p>{defaultAmount} USD = {conversion.result.toFixed(2)} EUR</p>
    </div>
  );
};
