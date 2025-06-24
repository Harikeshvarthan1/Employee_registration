import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, isAdmin, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: 'home', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/employees', label: 'Employees', icon: 'people', allowedRoles: ['ADMIN'] },
      { path: '/attendance', label: 'Attendance', icon: 'calendar-check', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/salary', label: 'Salary', icon: 'cash-stack', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/loan-register', label: 'Loan Register', icon: 'bank', allowedRoles: ['ADMIN'] },
      { path: '/loan-repay', label: 'Loan Repayment', icon: 'credit-card', allowedRoles: ['ADMIN', 'USER'] },
    ];

    return items.filter(item => 
      item.allowedRoles.includes(isAdmin() ? 'ADMIN' : 'USER')
    );
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="main-header fixed-header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/dashboard" className="logo">
            <div className="logo-icon">
              <i className="bi bi-building"></i>
            </div>
            <div className="logo-text">
              <span className="app-name">EMS</span>
              <span className="app-tagline">Employee Management</span>
            </div>
          </Link>
        </div>

        <button 
          className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <div className={`nav-container ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="main-nav">
            <ul className="nav-list">
              {getNavItems().map((item, index) => (
                <li key={index} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
                  <Link to={item.path} className="nav-link">
                    <i className={`bi bi-${item.icon}`}></i>
                    <span>{item.label}</span>
                    {isActive(item.path) && <span className="active-indicator"></span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {currentUser && (
            <div className="user-section" ref={dropdownRef}>
              <div 
                className="user-profile"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar">
                  {isAdmin() ? (
                    <i className="bi bi-person-badge-fill"></i>
                  ) : (
                    <i className="bi bi-person-circle"></i>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.userName}</span>
                  <span className="user-role">{isAdmin() ? 'Administrator' : 'User'}</span>
                </div>
                <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} dropdown-arrow`}></i>
              </div>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="large-avatar">
                      {isAdmin() ? (
                        <i className="bi bi-person-badge-fill"></i>
                      ) : (
                        <i className="bi bi-person-circle"></i>
                      )}
                    </div>
                    <div>
                      <div className="large-name">{currentUser.userName}</div>
                      <div className="user-email">{currentUser.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-items">
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <i className="bi bi-box-arrow-right"></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;