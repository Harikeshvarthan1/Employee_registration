// src/components/dashboard/EmployeeStats.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllEmployees, getAllActiveEmployees } from "../../apis/employeeApi";
import type{ Employee } from "../../models/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./EmployeeStats.css";

interface EmployeeStatsProps {
  showDetails?: boolean;
  onViewAllClick?: () => void;
}

const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  showDetails = true,
  onViewAllClick,
}) => {
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // UI states
  const [activeTab, setActiveTab] = useState<
    "overview" | "departments" | "trends"
  >("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [highlightedStat, setHighlightedStat] = useState<string | null>(null);

  // Animation refs
  const statsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [allEmps, activeEmps] = await Promise.all([
          getAllEmployees(),
          getAllActiveEmployees(),
        ]);

        setEmployees(allEmps);
        setActiveEmployees(activeEmps);
      } catch (err: any) {
        console.error("Error fetching employee stats:", err);
        setError(err.message || "Failed to load employee statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data
  const refreshData = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const [allEmps, activeEmps] = await Promise.all([
        getAllEmployees(),
        getAllActiveEmployees(),
      ]);

      setEmployees(allEmps);
      setActiveEmployees(activeEmps);

      // Show success animation
      if (statsRef.current) {
        statsRef.current.classList.add("refresh-success");
        setTimeout(() => {
          if (statsRef.current) {
            statsRef.current.classList.remove("refresh-success");
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error("Error refreshing employee stats:", err);
      setError(err.message || "Failed to refresh employee statistics");
    } finally {
      setRefreshing(false);
    }
  };

  // Navigate to employees page
  const handleViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick();
    } else {
      navigate("/employees");
    }
  };

  // Highlight a stat when hovered
  const handleStatHover = (statId: string | null) => {
    setHighlightedStat(statId);
  };

  // Toggle chart expansion
  const toggleChartExpansion = (chartId: string) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  // Calculate employee statistics
  const calculateStats = () => {
    if (!employees.length) return null;

    // Active vs. inactive count
    const activeCount = activeEmployees.length;
    const inactiveCount = employees.length - activeCount;
    const activePercentage = Math.round((activeCount / employees.length) * 100);

    // Department distribution
    const departments = employees.reduce(
      (acc: { [key: string]: number }, emp) => {
        const role = emp.role || "Unassigned";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {}
    );

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHires = employees.filter((emp) => {
      const joinDate = new Date(emp.joinDate);
      return joinDate >= thirtyDaysAgo;
    });

    // Calculate average salary
    const totalSalary = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
    const averageSalary = employees.length ? totalSalary / employees.length : 0;

    // Calculate highest and lowest salary
    const sortedBySalary = [...employees].sort(
      (a, b) => b.baseSalary - a.baseSalary
    );
    const highestSalary = sortedBySalary.length
      ? sortedBySalary[0].baseSalary
      : 0;
    const lowestSalary = sortedBySalary.length
      ? sortedBySalary[sortedBySalary.length - 1].baseSalary
      : 0;

    return {
      totalEmployees: employees.length,
      activeEmployees: activeCount,
      inactiveEmployees: inactiveCount,
      activePercentage,
      departments,
      recentHires: recentHires.length,
      averageSalary,
      highestSalary,
      lowestSalary,
      totalSalary,
    };
  };

  // Prepare chart data for role distribution
  const getDepartmentData = () => {
    const stats = calculateStats();
    if (!stats) return [];

    return Object.entries(stats.departments)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 departments
  };

  // Sample data for monthly employee count trend
  const getTrendData = () => {
    // In a real app, this would come from historical data
    // Mocking some data for demonstration
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return months.map((month) => ({
      name: month,
      total: Math.floor(Math.random() * 20) + 30,
      active: Math.floor(Math.random() * 15) + 20,
    }));
  };

  // Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};


  // Colors for charts
  const CHART_COLORS = [
    "#4361ee",
    "#3a0ca3",
    "#f72585",
    "#4cc9f0",
    "#7209b7",
    "#4895ef",
  ];

  // Get stats
  const stats = calculateStats();

  return (
    <div
      className={`employee-stats-container ${
        expandedChart ? "has-expanded-chart" : ""
      }`}
      ref={statsRef}
    >
      {/* Header with title and actions */}
      <div className="stats-header">
        <div className="stats-title">
          <h2>
            <i className="bi bi-people-fill"></i> Employee Statistics
          </h2>
          {!loading && !error && employees.length > 0 && (
            <p className="stats-subtitle">
              {stats?.activeEmployees} active of {stats?.totalEmployees} total
              employees
            </p>
          )}
        </div>

        <div className="stats-actions">
          <button
            className={`refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={refreshData}
            disabled={loading || refreshing}
            title="Refresh data"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>

          {showDetails && (
            <button
              className="view-all-btn"
              onClick={handleViewAllClick}
              title="View all employees"
            >
              <span>View All</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="stats-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={refreshData}>
            <i className="bi bi-arrow-clockwise"></i> Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="stats-loading">
          <div className="shimmer-card"></div>
          <div className="shimmer-grid">
            <div className="shimmer-item"></div>
            <div className="shimmer-item"></div>
            <div className="shimmer-item"></div>
            <div className="shimmer-item"></div>
          </div>
          <div className="shimmer-chart"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && employees.length === 0 && (
        <div className="stats-empty">
          <div className="empty-icon">
            <i className="bi bi-people"></i>
          </div>
          <h3>No Employee Data</h3>
          <p>There are no employees in the system yet.</p>
          <button
            className="add-employee-btn"
            onClick={() => navigate("/employees/add")}
          >
            <i className="bi bi-person-plus"></i>
            <span>Add Your First Employee</span>
          </button>
        </div>
      )}

      {/* Stats Content */}
      {!loading && !error && employees.length > 0 && stats && (
        <div className="stats-content">
          {/* Tabs Navigation */}
          <div className="stats-tabs">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="bi bi-grid-1x2"></i>
              <span>Overview</span>
            </button>

            <button
              className={`tab-btn ${
                activeTab === "departments" ? "active" : ""
              }`}
              onClick={() => setActiveTab("departments")}
            >
              <i className="bi bi-diagram-3"></i>
              <span>Departments</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "trends" ? "active" : ""}`}
              onClick={() => setActiveTab("trends")}
            >
              <i className="bi bi-graph-up"></i>
              <span>Trends</span>
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="tab-content">
              {/* Key metrics */}
              <div className="key-metrics">
                <div
                  className={`metric-card ${
                    highlightedStat === "total" ? "highlighted" : ""
                  }`}
                  onMouseEnter={() => handleStatHover("total")}
                  onMouseLeave={() => handleStatHover(null)}
                >
                  <div className="metric-icon total">
                    <i className="bi bi-people"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{stats.totalEmployees}</h3>
                    <p>Total Employees</p>
                  </div>
                </div>

                <div
                  className={`metric-card ${
                    highlightedStat === "active" ? "highlighted" : ""
                  }`}
                  onMouseEnter={() => handleStatHover("active")}
                  onMouseLeave={() => handleStatHover(null)}
                >
                  <div className="metric-icon active">
                    <i className="bi bi-person-check"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{stats.activeEmployees}</h3>
                    <p>Active Employees</p>
                  </div>
                  <div className="metric-badge positive">
                    {stats.activePercentage}%
                  </div>
                </div>

                <div
                  className={`metric-card ${
                    highlightedStat === "inactive" ? "highlighted" : ""
                  }`}
                  onMouseEnter={() => handleStatHover("inactive")}
                  onMouseLeave={() => handleStatHover(null)}
                >
                  <div className="metric-icon inactive">
                    <i className="bi bi-person-dash"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{stats.inactiveEmployees}</h3>
                    <p>Inactive Employees</p>
                  </div>
                  <div className="metric-badge">
                    {100 - stats.activePercentage}%
                  </div>
                </div>

                <div
                  className={`metric-card ${
                    highlightedStat === "recent" ? "highlighted" : ""
                  }`}
                  onMouseEnter={() => handleStatHover("recent")}
                  onMouseLeave={() => handleStatHover(null)}
                >
                  <div className="metric-icon recent">
                    <i className="bi bi-person-plus"></i>
                  </div>
                  <div className="metric-data">
                    <h3>{stats.recentHires}</h3>
                    <p>Recent Hires</p>
                  </div>
                  <div className="metric-badge info">30d</div>
                </div>
              </div>

              {/* Role distribution chart */}
              <div
                className={`chart-container ${
                  expandedChart === "roles" ? "expanded" : ""
                }`}
              >
                <div className="chart-header">
                  <h3>Role Distribution</h3>
                  <button
                    className="expand-btn"
                    onClick={() => toggleChartExpansion("roles")}
                  >
                    <i
                      className={`bi bi-${
                        expandedChart === "roles"
                          ? "fullscreen-exit"
                          : "fullscreen"
                      }`}
                    ></i>
                  </button>
                </div>

                <div className="chart-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getDepartmentData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {getDepartmentData().map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} employees`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Salary Insights */}
              <div className="salary-insights">
                <h3>Salary Insights</h3>

                <div className="salary-stats">
                  <div className="salary-stat">
                    <div className="stat-label">Average Salary</div>
                    <div className="stat-value">
                      {formatCurrency(stats.averageSalary)}
                    </div>
                    <div className="stat-icon">
                      <i className="bi bi-cash-stack"></i>
                    </div>
                  </div>

                  <div className="salary-stat">
                    <div className="stat-label">Highest Salary</div>
                    <div className="stat-value">
                      {formatCurrency(stats.highestSalary)}
                    </div>
                    <div className="stat-icon">
                      <i className="bi bi-graph-up-arrow"></i>
                    </div>
                  </div>

                  <div className="salary-stat">
                    <div className="stat-label">Lowest Salary</div>
                    <div className="stat-value">
                      {formatCurrency(stats.lowestSalary)}
                    </div>
                    <div className="stat-icon">
                      <i className="bi bi-graph-down-arrow"></i>
                    </div>
                  </div>

                  <div className="salary-stat">
                    <div className="stat-label">Monthly Budget</div>
                    <div className="stat-value">
                      {formatCurrency(stats.totalSalary)}
                    </div>
                    <div className="stat-icon">
                      <i className="bi bi-wallet2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === "departments" && (
            <div className="tab-content">
              <div className="departments-header">
                <h3>Department Breakdown</h3>
                <p>Distribution of employees across different roles</p>
              </div>

              <div className="departments-grid">
                {Object.entries(stats.departments)
                  .sort((a, b) => b[1] - a[1])
                  .map(([department, count], index) => (
                    <div className="department-card" key={department}>
                      <div
                        className="department-icon"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length] + "20",
                          color: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      >
                        <i
                          className={`bi bi-${
                            department.toLowerCase().includes("dev")
                              ? "code-square"
                              : department.toLowerCase().includes("design")
                              ? "brush"
                              : department.toLowerCase().includes("market")
                              ? "megaphone"
                              : department.toLowerCase().includes("sale")
                              ? "cart"
                              : department.toLowerCase().includes("hr")
                              ? "person-workspace"
                              : "briefcase"
                          }`}
                        ></i>
                      </div>
                      <div className="department-info">
                        <h4>{department}</h4>
                        <div className="department-count">
                          <span>{count}</span>
                          <span className="count-label">employees</span>
                        </div>
                      </div>
                      <div className="department-percentage">
                        {Math.round((count / stats.totalEmployees) * 100)}%
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.departments).map(
                        ([name, value]) => ({ name, value })
                      )}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(stats.departments).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} employees`, "Count"]}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="tab-content">
              <div className="trends-header">
                <h3>Employee Growth Trends</h3>

                <div className="time-range-selector">
                  <button
                    className={selectedTimeRange === "week" ? "active" : ""}
                    onClick={() => setSelectedTimeRange("week")}
                  >
                    Weekly
                  </button>
                  <button
                    className={selectedTimeRange === "month" ? "active" : ""}
                    onClick={() => setSelectedTimeRange("month")}
                  >
                    Monthly
                  </button>
                  <button
                    className={selectedTimeRange === "quarter" ? "active" : ""}
                    onClick={() => setSelectedTimeRange("quarter")}
                  >
                    Quarterly
                  </button>
                  <button
                    className={selectedTimeRange === "year" ? "active" : ""}
                    onClick={() => setSelectedTimeRange("year")}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="trends-chart">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getTrendData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} employees`, ""]}
                    />
                    <Legend />
                    <Bar
                      dataKey="total"
                      name="Total Employees"
                      fill="#4361ee"
                    />
                    <Bar
                      dataKey="active"
                      name="Active Employees"
                      fill="#4cc9f0"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="trends-insights">
                <div className="insight-card positive">
                  <div className="insight-icon">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <div className="insight-content">
                    <h4>Growing Team</h4>
                    <p>Your team grew by 12% in the last 3 months</p>
                  </div>
                </div>

                <div className="insight-card neutral">
                  <div className="insight-icon">
                    <i className="bi bi-person-dash"></i>
                  </div>
                  <div className="insight-content">
                    <h4>Turnover Rate</h4>
                    <p>5% turnover rate, lower than industry average</p>
                  </div>
                </div>

                <div className="insight-card warning">
                  <div className="insight-icon">
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>
                  <div className="insight-content">
                    <h4>Department Balance</h4>
                    <p>
                      Development team growing faster than other departments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeStats;