// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';

const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;