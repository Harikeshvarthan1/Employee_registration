// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import bootstrap and global styles
import 'bootstrap/dist/css/bootstrap.min.css';

// Set up axios default configuration - updated for Employee Management System
axios.defaults.baseURL = 'http://localhost:8081/Employee_register/api/v1';

axios.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('ems_user');
    const token = storedUser 
      ? JSON.parse(storedUser).token 
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ems_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

