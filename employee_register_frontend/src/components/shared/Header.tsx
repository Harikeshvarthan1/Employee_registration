import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

// You'll need to create this context or pass auth as props
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, isAdmin, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: 'home', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/employees', label: 'Employees', icon: 'people', allowedRoles: ['ADMIN'] },
      { path: '/attendance', label: 'Attendance', icon: 'calendar-check', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/salary', label: 'Salary', icon: 'cash-stack', allowedRoles: ['ADMIN', 'USER'] },
      { path: '/loan-register', label: 'Loan Register', icon: 'bank', allowedRoles: ['ADMIN'] },
      { path: '/loan-repay', label: 'Loan Repayment', icon: 'credit-card', allowedRoles: ['ADMIN', 'USER'] },
    ];

    // Filter items based on user role
    return items.filter(item => 
      item.allowedRoles.includes(isAdmin() ? 'ADMIN' : 'USER')
    );
  };

  // Check if a route is active
  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="main-header fixed-header">
      <div className="header-container">
        {/* Logo and branding */}
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

        {/* Mobile menu toggle */}
        <button 
          className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        {/* Navigation and user actions */}
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

          {/* User profile section */}
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

              {/* User dropdown menu */}
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