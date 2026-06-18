export type UseDashboard = () => { summary: string | null; loading: boolean };
export const USE_DASHBOARD = Symbol.for('@gaev/dashboard/USE_DASHBOARD');
