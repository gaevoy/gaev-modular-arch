export interface IDashboardService {
    getSummary(): Promise<string>;
}
export const DASHBOARD_SERVICE = Symbol.for('@gaev/dashboard/DASHBOARD_SERVICE');
