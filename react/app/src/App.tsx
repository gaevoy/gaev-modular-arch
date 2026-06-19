import React, { Suspense, type ComponentType } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { resolveAsync } from '@gaev/container';
import { USER_PAGE } from '@gaev/user-contract';
import { CURRENCY_PAGE } from '@gaev/currency-contract';
import { DASHBOARD_PAGE } from '@gaev/dashboard-contract';

const createLazyPage = (symbol: symbol) =>
  React.lazy(async () => ({
    default: await resolveAsync<ComponentType>(symbol)
  }));

const UserPage = createLazyPage(USER_PAGE);
const CurrencyPage = createLazyPage(CURRENCY_PAGE);
const DashboardPage = createLazyPage(DASHBOARD_PAGE);

export default function App() {
  return (
    <HashRouter>
      <nav>
        <Link to="/user">User</Link> |{' '}
        <Link to="/currency">Currency</Link> |{' '}
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Suspense fallback={<p>Loading…</p>}>
        <Routes>
          <Route path="/user" element={<UserPage />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<p>Select a page above</p>} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
