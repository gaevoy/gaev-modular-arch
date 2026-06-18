import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrap } from './bootstrap';
import App from './App';

bootstrap();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
