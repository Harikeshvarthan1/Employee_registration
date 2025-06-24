import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllEmployees,
  deleteEmployee,
} from "../../apis/employeeApi";
import type{ Employee } from "../../models/types";
import "./EmployeeList.css";

interface EmployeeListProps {
  onEditEmployee?: (employee: Employee) => void;
  onAddEmployee?: () => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  onEditEmployee,
  onAddEmployee,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("nameAsc");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );

  const [uniqueRoles, setUniqueRoles] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllEmployees();

      setEmployees(data);
      extractUniqueRoles(data);
      applyFilters(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load employees");
      setIsLoading(false);
    }
  };

  const extractUniqueRoles = (data: Employee[]) => {
    const roles = Array.from(
      new Set(data.map((emp) => emp.role).filter(Boolean))
    );
    setUniqueRoles(roles);
  };

  const applyFilters = useCallback(
    (data: Employee[] = employees) => {
      let result = [...data];

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (emp) =>
            emp.name.toLowerCase().includes(term) ||
            emp.role.toLowerCase().includes(term) ||
            emp.phoneNo.includes(term) ||
            emp.address.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== "all") {
        result = result.filter((emp) => emp.status === statusFilter);
      }

      if (roleFilter) {
        result = result.filter((emp) => emp.role === roleFilter);
      }

      switch (sortOption) {
        case "nameAsc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "nameDesc":
          result.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "joinDateDesc":
          result.sort((a, b) => {
            const dateA = new Date(a.joinDate).getTime();
            const dateB = new Date(b.joinDate).getTime();
            return dateB - dateA;
          });
          break;
        case "joinDateAsc":
          result.sort((a, b) => {
            const dateA = new Date(a.joinDate).getTime();
            const dateB = new Date(b.joinDate).getTime();
            return dateA - dateB;
          });
          break;
        case "salaryDesc":
          result.sort((a, b) => b.baseSalary - a.baseSalary);
          break;
        case "salaryAsc":
          result.sort((a, b) => a.baseSalary - b.baseSalary);
          break;
      }

      setFilteredEmployees(result);
    },
    [employees, searchTerm, statusFilter, roleFilter, sortOption]
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters, searchTerm, statusFilter, roleFilter, sortOption]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("");
    setSortOption("nameAsc");
  };

  const confirmDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setEmployeeToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDelete = async () => {
    if (!employeeToDelete || !employeeToDelete.id) return;

    setIsLoading(true);

    try {
      await deleteEmployee(employeeToDelete.id);

      setEmployees((prev) =>
        prev.filter((emp) => emp.id !== employeeToDelete.id)
      );
      applyFilters(employees.filter((emp) => emp.id !== employeeToDelete.id));

      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
      setIsLoading(false);
    }
  };
  
  const handleEdit = (employee: Employee) => {
    if (onEditEmployee) {
      onEditEmployee(employee);
    } else {
      navigate(`/employees/edit/${employee.id}`);
    }
  };

  const handleAddEmployee = () => {
    if (onAddEmployee) {
      onAddEmployee();
    } else {
      navigate("/employees/add");
    }
  };

  const getActiveEmployeeCount = () => {
    return employees.filter((emp) => emp.status === "active").length;
  };

  const getInactiveEmployeeCount = () => {
    return employees.filter((emp) => emp.status === "inactive").length;
  };

  const getTotalSalaryBudget = () => {
    return employees
      .filter((emp) => emp.status === "active")
      .reduce((total, emp) => total + emp.baseSalary, 0);
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };


  return (
    <div className="employee-list-container">
      <div className="employee-list-header">
        <div className="header-title">
          <h2>
            <i className="bi bi-people-fill"></i> Employee Management
          </h2>
          <p className="text-muted">
            Manage your employees, their details and employment status
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary add-employee-btn"
            onClick={handleAddEmployee}
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-card total-employees">
          <div className="stat-icon">
            <i className="bi bi-people"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">Total Employees</div>
          </div>
        </div>

        <div className="stat-card active-employees">
          <div className="stat-icon">
            <i className="bi bi-person-check"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{getActiveEmployeeCount()}</div>
            <div className="stat-label">Active Employees</div>
          </div>
        </div>

        <div className="stat-card inactive-employees">
          <div className="stat-icon">
            <i className="bi bi-person-dash"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{getInactiveEmployeeCount()}</div>
            <div className="stat-label">Inactive Employees</div>
          </div>
        </div>

        <div className="stat-card salary-budget">
          <div className="stat-icon">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">
              {formatCurrency(getTotalSalaryBudget())}
            </div>
            <div className="stat-label">Monthly Salary Budget</div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search employees by name, role, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
              <option value="joinDateDesc">Newest First</option>
              <option value="joinDateAsc">Oldest First</option>
              <option value="salaryDesc">Salary (High-Low)</option>
              <option value="salaryAsc">Salary (Low-High)</option>
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <i className="bi bi-grid-3x3-gap"></i>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <i className="bi bi-list-ul"></i>
            </button>
          </div>
        </div>
      </div>

      {(searchTerm || statusFilter !== "all" || roleFilter) && (
        <div className="active-filters">
          <div className="filters-applied">
            <span className="filters-label">Filters applied:</span>

            {searchTerm && (
              <div className="filter-tag">
                <i className="bi bi-search"></i>
                <span>"{searchTerm}"</span>
                <button onClick={() => setSearchTerm("")}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {statusFilter !== "all" && (
              <div className="filter-tag">
                <i className="bi bi-toggle-on"></i>
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter("all")}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {roleFilter && (
              <div className="filter-tag">
                <i className="bi bi-briefcase"></i>
                <span>Role: {roleFilter}</span>
                <button onClick={() => setRoleFilter("")}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset All
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="spinner">
            <div className="double-bounce1"></div>
            <div className="double-bounce2"></div>
          </div>
          <p>Loading employees...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="error-container">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Error Loading Employees</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadEmployees}>
            <i className="bi bi-arrow-clockwise"></i> Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && employees.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-people"></i>
          </div>
          <h3>No Employees Found</h3>
          <p>Start by adding your first employee to the system</p>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            <i className="bi bi-person-plus"></i> Add First Employee
          </button>
        </div>
      )}

      {!isLoading &&
        !error &&
        employees.length > 0 &&
        filteredEmployees.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-search"></i>
            </div>
            <h3>No Matching Employees</h3>
            <p>No employees match your current filters</p>
            <button className="btn btn-outline-primary" onClick={resetFilters}>
              <i className="bi bi-arrow-counterclockwise"></i> Reset Filters
            </button>
          </div>
        )}

      {!isLoading && !error && filteredEmployees.length > 0 && (
        <div
          className={`employees-container ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className={`employee-card ${
                employee.status === "inactive" ? "inactive" : ""
              }`}
            >
              <div className={`status-badge ${employee.status}`}>
                {employee.status === "active" ? "Active" : "Inactive"}
              </div>

              <div className="employee-card-content">
                <div className="employee-primary-info">
                  <div className="employee-avatar">
                    <div className="avatar-circle">
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div className="employee-basic-info">
                    <h3 className="employee-name">{employee.name}</h3>
                    <p className="employee-role">{employee.role}</p>
                  </div>
                </div>

                <div className="employee-details">
                  <div className="detail-item">
                    <i className="bi bi-telephone"></i>
                    <span>{employee.phoneNo}</span>
                  </div>

                  <div className="detail-item">
                    <i className="bi bi-geo-alt"></i>
                    <span className="address-text">{employee.address}</span>
                  </div>

                  <div className="detail-item">
                    <i className="bi bi-calendar-check"></i>
                    <span>Joined: {formatDate(employee.joinDate)}</span>
                  </div>

                  <div className="detail-item">
                    <i className="bi bi-cash"></i>
                    <span>{formatCurrency(employee.baseSalary)}/month</span>
                  </div>
                </div>

                <div className="employee-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(employee)}
                    aria-label="Edit employee"
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>

                  <button
                    className="action-btn delete-btn"
                    onClick={() => confirmDelete(employee)}
                    aria-label="Delete employee"
                  >
                    <i className="bi bi-trash"></i>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="floating-add-btn" onClick={handleAddEmployee}>
        <i className="bi bi-plus-lg"></i>
        <span className="tooltip">Add Employee</span>
      </button>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h3>
                <i className="bi bi-exclamation-triangle"></i> Confirm Delete
              </h3>
              <button className="close-btn" onClick={cancelDelete}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the employee{" "}
                <strong>{employeeToDelete?.name}</strong>?
              </p>
              <p className="text-danger">
                This action cannot be undone and will permanently remove this
                employee from the system.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={cancelDelete}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <i className="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
