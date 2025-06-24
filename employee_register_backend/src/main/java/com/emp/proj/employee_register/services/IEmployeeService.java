package com.emp.proj.employee_register.services;

import java.util.List;

import com.emp.proj.employee_register.entities.Employee;

public interface IEmployeeService {
    Employee addEmployee(Employee employee);
    Employee getEmployeeById(Integer id);
    List<Employee> getAllEmployees();
    List<Employee> getAllActiveEmployees();
    Employee updateEmployee(Employee employee);
    Employee updateEmployeeStatus(Integer id, String status);
    boolean deleteEmployee(Integer id);
    int getActiveEmployeesCount();
}
