import { resolveAsync } from '@gaev/container';
import { USE_CURRENT_USER, type UseCurrentUser } from '@gaev/user-contract';
import { DashboardWidget } from './DashboardWidget';

const useCurrentUser = await resolveAsync<UseCurrentUser>(USE_CURRENT_USER);

export default function DashboardPage() {
  const { user } = useCurrentUser();
  return (
    <div>
      <p>Logged in as: {user?.name ?? '…'}</p>
      <DashboardWidget />
    </div>
  );
}
