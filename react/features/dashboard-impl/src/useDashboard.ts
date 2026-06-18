import { useState, useEffect } from 'react';
import { container } from '@gaev/container';
import {
  DASHBOARD_SERVICE,
  type IDashboardService
} from '@gaev/dashboard-contract';

export default function useDashboard(): { summary: string | null; loading: boolean } {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const service = container.get<IDashboardService>(DASHBOARD_SERVICE);
    service.getSummary().then(s => {
      if (!cancelled) { setSummary(s); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  return { summary, loading };
}
