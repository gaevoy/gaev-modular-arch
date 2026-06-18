import { IDashboardService } from '@gaev/dashboard-contract';

export class DashboardService extends IDashboardService {
  async getSummary(): Promise<string> {
    return 'All systems operational';
  }
}
