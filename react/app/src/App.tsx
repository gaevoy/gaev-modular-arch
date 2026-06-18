import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';

const UserPage = React.lazy(() => import('./pages/UserPage'));
const CurrencyPage = React.lazy(() => import('./pages/CurrencyPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

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
