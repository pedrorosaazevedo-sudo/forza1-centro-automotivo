import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <Navigation />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
