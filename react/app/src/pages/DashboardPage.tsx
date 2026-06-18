import type { ComponentType } from 'react';
import { resolveAsync } from '@gaev/container';
import { USE_CURRENT_USER, type UseCurrentUser } from '@gaev/user-contract';
import { DASHBOARD_WIDGET, type DashboardWidgetProps } from '@gaev/dashboard-contract';

const [useCurrentUser, DashboardWidget] = await Promise.all([
  resolveAsync<UseCurrentUser>(USE_CURRENT_USER),
  resolveAsync<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET),
]);

export default function DashboardPage() {
  const { user } = useCurrentUser();
  return (
    <div>
      <p>Logged in as: {user?.name ?? '…'}</p>
      <DashboardWidget />
    </div>
  );
}
