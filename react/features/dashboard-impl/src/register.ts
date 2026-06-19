import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  DASHBOARD_SERVICE,
  DASHBOARD_WIDGET,
  DASHBOARD_PAGE,
  USE_DASHBOARD,
  type IDashboardService,
  type DashboardWidgetProps,
  type DashboardPageProps,
  type UseDashboard,
} from '@gaev/dashboard-contract';
import { DashboardService } from './DashboardService';
import { DashboardWidget } from './DashboardWidget';
import useDashboard from './useDashboard';
import DashboardPage from './DashboardPage';

container.bind<IDashboardService>(DASHBOARD_SERVICE).toDynamicValue(() => new DashboardService());
container.bind<ComponentType<DashboardWidgetProps>>(DASHBOARD_WIDGET).toConstantValue(DashboardWidget);
container.bind<UseDashboard>(USE_DASHBOARD).toConstantValue(useDashboard);
container.bind<ComponentType<DashboardPageProps>>(DASHBOARD_PAGE).toConstantValue(DashboardPage);
