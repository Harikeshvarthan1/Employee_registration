import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeStats } from '../apis/employeeApi';
import { getSalaryStatistics } from '../apis/salaryApi';
import { getAttendanceSummary } from '../apis/attendanceApi';
import { getLoanStatistics } from '../apis/loanRegistrationApi';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const greetingRef = useRef<HTMLDivElement>(null);

  // State for dashboard data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [employeeStats, setEmployeeStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    recentHires: []
  });
  const [salaryStats, setSalaryStats] = useState<any>({
    totalPaid: 0,
    thisMonth: 0,
    lastMonth: 0,
    recentPayments: []
  });
  const [, setAttendanceStats] = useState<any>({
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    monthlyAttendance: []
  });
  const [loanStats, setLoanStats] = useState<any>({
    activeLoans: 0,
    totalLoanAmount: 0,
    pendingRepayments: 0,
    recentLoans: []
  });
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [greeting, setGreeting] = useState<string>('');
  const [weatherData, setWeatherData] = useState<any>({
    temp: 25,
    condition: 'Sunny'
  });
  const [refreshTime, setRefreshTime] = useState<string>('');
  
  // States for triple tap loader feature
  const [, setTapCount] = useState<number>(0);
  const [showSecretMessage, setShowSecretMessage] = useState<boolean>(false);

  // Determine if we should show loading state (either loading or error occurred)
  const showLoading = isLoading || error !== null;

  // Handle triple tap on loader
  const handleLoaderTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      
      // If it's the third tap, show the secret message
      if (newCount === 3) {
        setShowSecretMessage(true);
        
        // Hide the message after 5 seconds
        setTimeout(() => {
          setShowSecretMessage(false);
        }, 5000);
        
        // Reset the counter after showing the message
        setTimeout(() => {
          setTapCount(0);
        }, 1000);
        
        return 0;
      }
      
      // Reset tap count if not tapped again within 2 seconds
      setTimeout(() => {
        setTapCount(0);
      }, 2000);
      
      return newCount;
    });
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Set appropriate greeting based on time of day
        const now = new Date();
        const hour = now.getHours();
        let timeGreeting = '';
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 18) timeGreeting = 'Good afternoon';
        else timeGreeting = 'Good evening';

        setGreeting(`${timeGreeting}, ${currentUser?.userName || 'User'}`);

        // Set refresh time
        setRefreshTime(now.toLocaleTimeString());

        // Load stats based on user role
        if (isAdmin()) {
          // Admin dashboard data
          const [empStats, salStats, attStats, loanData] = await Promise.all([
            getEmployeeStats(),
            getSalaryStatistics(),
            getAttendanceSummary(),
            getLoanStatistics()
          ]);
          
          setEmployeeStats(empStats);
          setSalaryStats(salStats);
          setAttendanceStats(attStats);
          setLoanStats(loanData);
          
          // Sample quick links for admin - enhanced with more options
          setQuickLinks([
            { id: 1, title: 'Add Employee', path: '/employees/add', icon: 'person-plus' },
            { id: 2, title: 'Record Attendance', path: '/attendance', icon: 'calendar-check' },
            { id: 3, title: 'Process Payroll', path: '/salary', icon: 'cash-stack' },
            { id: 4, title: 'Review Loans', path: '/loan-register', icon: 'bank' },
            { id: 5, title: 'Analytics', path: '/analytics', icon: 'graph-up' },
            { id: 6, title: 'Reports', path: '/reports', icon: 'file-earmark-text' },
          ]);
          
        } else {
          // Regular user dashboard data - simplified data
          const [attStats, salStats] = await Promise.all([
            getAttendanceSummary(),
            getSalaryStatistics()
          ]);
          
          setAttendanceStats(attStats);
          setSalaryStats(salStats);
          
          // Sample quick links for regular user - enhanced with more options
          setQuickLinks([
            { id: 1, title: 'View Attendance', path: '/attendance', icon: 'calendar-check' },
            { id: 2, title: 'Salary History', path: '/salary', icon: 'wallet2' },
            { id: 3, title: 'Repay Loan', path: '/loan-repay', icon: 'credit-card' },
            { id: 4, title: 'Leave Request', path: '/leave-request', icon: 'calendar-x' },
            { id: 5, title: 'Personal Info', path: '/profile', icon: 'person-circle' },
            { id: 6, title: 'Help Desk', path: '/help', icon: 'question-circle' },
          ]);
        }

        // Simulate weather data fetch (would be a real API in production)
        setWeatherData({
          temp: Math.floor(20 + Math.random() * 15),
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
        });

        // Check if dark mode is enabled
        const darkModePref = localStorage.getItem('ems-dark-mode');
        if (darkModePref === 'true') {
          setIsDarkMode(true);
          document.body.classList.add('dark-mode');
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        // We're not setting isLoading to false here, to keep the loading spinner active
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // Add parallax effect to greeting
    const handleMouseMove = (e: MouseEvent) => {
      const greeting = greetingRef.current;
      if (greeting) {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;
        greeting.style.transform = `translateX(${x}px) translateY(${y}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      setRefreshTime(new Date().toLocaleTimeString());
    }, 300000); // 5 minutes

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(refreshInterval);
      // Clean up dark mode class when component unmounts to avoid affecting other pages
      if (isDarkMode) {
        document.body.classList.remove('dark-mode');
      }
    };
  }, [currentUser, isAdmin]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('ems-dark-mode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('ems-dark-mode', 'false');
    }
  };

  // Manually refresh dashboard data
  const refreshDashboard = () => {
    setIsLoading(true);
    setRefreshTime(new Date().toLocaleTimeString());

    // Simulate data refresh with timeout
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  // Navigate to a page
  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Get current date in formatted string
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Monthly salary data
  const getMonthlySalaryData = () => {
    // Use the data from the API if available, otherwise provide a fallback
    return salaryStats.monthlyData || [
      { name: 'Jan', amount: 48000 },
      { name: 'Feb', amount: 52000 },
      { name: 'Mar', amount: 49000 },
      { name: 'Apr', amount: 53000 },
      { name: 'May', amount: 56000 },
      { name: 'Jun', amount: 58000 }
    ];
  };

  // Project timeline data
  const getProjectTimelineData = () => {
    return [
      { name: 'Week 1', planned: 15, completed: 12 },
      { name: 'Week 2', planned: 18, completed: 16 },
      { name: 'Week 3', planned: 22, completed: 20 },
      { name: 'Week 4', planned: 25, completed: 22 },
      { name: 'Week 5', planned: 20, completed: 20 },
      { name: 'Week 6', planned: 18, completed: 17 }
    ];
  };

  return (
    <div className="dashboard-container">
      {/* Welcome section with enhanced features */}
      <div className="welcome-header">
        <div className="welcome-section" ref={greetingRef}>
          <h1 className="greeting-text">{greeting}</h1>
          <p className="current-date">{getCurrentDate()}</p>
        </div>

        <div className="header-actions">
          {/* Weather widget */}
          <div className="weather-widget">
            <i className={`bi bi-${weatherData.condition === 'Sunny' ? 'sun' : 
                           weatherData.condition === 'Cloudy' ? 'cloud' : 
                           weatherData.condition === 'Rainy' ? 'cloud-rain' : 'cloud-sun'}`}></i>
            <span>{weatherData.temp}°C</span>
            <span className="weather-condition">{weatherData.condition}</span>
          </div>
          
          {/* Refresh button */}
          <button 
            className="refresh-button" 
            onClick={refreshDashboard} 
            disabled={showLoading}
            title="Refresh dashboard data"
          >
            <i className={`bi bi-arrow-clockwise ${showLoading ? 'spinning' : ''}`}></i>
            <span className="refresh-time">Last updated: {refreshTime}</span>
          </button>
          
          {/* Dark mode toggle button */}
          <button 
            className="dark-mode-toggle" 
            onClick={toggleDarkMode} 
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}`}></i>
          </button>
        </div>
      </div>

      {/* Loading State - Using the same design as in EmployeePage with triple tap feature */}
      {showLoading && (
        <div className="loading-container">
          <div className="loading-content" onClick={handleLoaderTap}>
            <div className="loading-spinner">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            <h3>Loading Dashboard Data</h3>
            <p>Please wait while we retrieve the information...</p>
            
            {/* Secret message that appears after triple tap */}
            {showSecretMessage && (
              <div className="secret-message">
                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                <p>Backend connection issue detected. Please contact system administrator.</p>
                <small>Error code: CONN_REFUSED_550</small>
              </div>
            )}
          </div>
        </div>
      )}

      {!showLoading && (
        <div className="dashboard-content">
          {/* Main Metrics */}
          <div className="metrics-section">
            {isAdmin() && (
              <>
                <div className="metric-card employees">
                  <div className="metric-icon">
                    <i className="bi bi-people"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{employeeStats.totalEmployees}</h3>
                    <p>Total Employees</p>
                  </div>
                  <div className="metric-trend">
                    <span className="positive">+4% </span>
                    <span>vs last month</span>
                  </div>
                </div>

                <div className="metric-card active">
                  <div className="metric-icon">
                    <i className="bi bi-person-check"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{employeeStats.activeEmployees}</h3>
                    <p>Active Employees</p>
                  </div>
                  <div className="metric-trend">
                    <span className="positive">+2% </span>
                    <span>vs last month</span>
                  </div>
                </div>
              </>
            )}

            
    

            <div className="metric-card salary">
              <div className="metric-icon">
                <i className="bi bi-cash-stack"></i>
              </div>
              <div className="metric-data">
                <h3>{formatCurrency(salaryStats.thisMonth)}</h3>
                <p>Salary This Month</p>
              </div>
              <div className="metric-trend">
                <span className={salaryStats.thisMonth > salaryStats.lastMonth ? "positive" : "negative"}>
                  {salaryStats.thisMonth > salaryStats.lastMonth ? "+" : "-"}
                  {Math.round(Math.abs((salaryStats.thisMonth - salaryStats.lastMonth) / salaryStats.lastMonth * 100))}%{" "}
                </span>
                <span>vs last month</span>
              </div>
            </div>

            {isAdmin() && (
              <div className="metric-card loans">
                <div className="metric-icon">
                  <i className="bi bi-bank"></i>
                </div>
                <div className="metric-data">
                  <h3>{loanStats.activeLoans}</h3>
                  <p>Active Loans</p>
                </div>
                <div className="metric-trend">
                  <span>{formatCurrency(loanStats.totalLoanAmount)}</span>
                  <span>total amount</span>
                </div>
              </div>
            )}
            
            
          </div>

          {/* Dashboard Grid - REVISED to remove specified sections and add new ones */}
          <div className="dashboard-grid">
            {/* Quick Links - Enhanced with bigger visual appearance */}
            <div className="dashboard-card quick-links expanded">
              <div className="card-header">
                <h3><i className="bi bi-lightning"></i> Quick Access</h3>
              </div>
              <div className="card-body">
                <div className="links-grid">
                  {quickLinks.map(link => (
                    <div 
                      className="link-item" 
                      key={link.id}
                      onClick={() => navigateTo(link.path)}
                    >
                      <div className="link-icon">
                        <i className={`bi bi-${link.icon}`}></i>
                      </div>
                      <span className="link-title">{link.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart: Salary Trends */}
            <div className="dashboard-card salary-chart">
              <div className="card-header">
                <h3><i className="bi bi-graph-up"></i> Salary Disbursement</h3>
                <div className="card-actions">
                  <button className="card-action-btn" onClick={() => navigateTo('/salary')}>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={getMonthlySalaryData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, 'Amount']} />
                    <Legend />
                    <Area type="monotone" dataKey="amount" stroke="#4361ee" fill="#4361ee" fillOpacity={0.2} activeDot={{ r: 8 }} name="Monthly Salary" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>


            {/* Loan Repayments (Only show if user has loans) */}
            {loanStats.pendingRepayments > 0 && (
              <div className="dashboard-card loan-repayments">
                <div className="card-header">
                  <h3><i className="bi bi-credit-card"></i> Loan Repayments</h3>
                  <div className="card-actions">
                    <button className="card-action-btn" onClick={() => navigateTo('/loan-repay')}>
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="repayments-summary">
                    <div className="summary-item">
                      <div className="summary-label">Active Loans</div>
                      <div className="summary-value">{loanStats.activeLoans}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total Amount</div>
                      <div className="summary-value">{formatCurrency(loanStats.totalLoanAmount)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Next Payment</div>
                      <div className="summary-value">July 15, 2023</div>
                    </div>
                  </div>
                  <button className="action-button" onClick={() => navigateTo('/loan-repay')}>
                    <i className="bi bi-credit-card"></i> Make a Payment
                  </button>
                </div>
              </div>
            )}
            
            {/* NEW: System Status */}
            <div className="dashboard-card system-status">
              <div className="card-header">
                <h3><i className="bi bi-info-circle"></i> System Status</h3>
              </div>
              <div className="card-body">
                <div className="status-grid">
                  <div className="status-item">
                    <div className="status-icon green">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="status-details">
                      <span className="status-title">Payroll System</span>
                      <span className="status-subtitle">Operational</span>
                    </div>
                  </div>
                  <div className="status-item">
                    <div className="status-icon green">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="status-details">
                      <span className="status-title">Attendance Tracker</span>
                      <span className="status-subtitle">Operational</span>
                    </div>
                  </div>
                  <div className="status-item">
                    <div className="status-icon yellow">
                      <i className="bi bi-exclamation-triangle"></i>
                    </div>
                    <div className="status-details">
                      <span className="status-title">Reporting Module</span>
                      <span className="status-subtitle">Maintenance at 9PM</span>
                    </div>
                  </div>
                  <div className="status-item">
                    <div className="status-icon green">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="status-details">
                      <span className="status-title">Database</span>
                      <span className="status-subtitle">Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Hires (Admin Only) */}
            {isAdmin() && (
              <div className="dashboard-card recent-hires">
                <div className="card-header">
                  <h3><i className="bi bi-person-plus"></i> Recent Hires</h3>
                  <div className="card-actions">
                    <button className="card-action-btn" onClick={() => navigateTo('/employees')}>
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="recent-hires-list">
                    {employeeStats.recentHires && employeeStats.recentHires.length > 0 ? (
                      employeeStats.recentHires.map((hire: any, index: number) => (
                        <div className="hire-item" key={index}>
                          <div className="hire-avatar">
                            <div className="avatar-circle">
                              {hire.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                          </div>
                          <div className="hire-details">
                            <div className="hire-name">{hire.name}</div>
                            <div className="hire-position">{hire.role}</div>
                            <div className="hire-date">Joined {formatDate(hire.joinDate)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <i className="bi bi-person-plus"></i>
                        <p>No recent hires to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;