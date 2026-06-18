import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  DASHBOARD_SERVICE,
  DASHBOARD_WIDGET,
  USE_DASHBOARD,
  type IDashboardService,
  type DashboardWidgetProps,
  type UseDashboard,
} from '@gaev/dashboard-contract';
import { DashboardService } from './DashboardService';
import { DashboardWidget } from './DashboardWidget';
import useDashboard from './useDashboard';

container.bind<IDashboardService>(DASHBOARD_SERVICE).toDynamicValue(() => new DashboardService());
container.bind<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET).toConstantValue(DashboardWidget);
container.bind<UseDashboard>(USE_DASHBOARD).toConstantValue(useDashboard);
