import type { IDashboardService } from '@gaev/dashboard-contract';

export class DashboardService implements IDashboardService {
  async getSummary(): Promise<string> {
    return 'All systems operational';
  }
}
