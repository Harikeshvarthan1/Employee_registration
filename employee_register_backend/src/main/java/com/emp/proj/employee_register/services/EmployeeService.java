package com.emp.proj.employee_register.services;

import com.emp.proj.employee_register.entities.Employee;
import com.emp.proj.employee_register.repository.IEmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService implements IEmployeeService {

    @Autowired
    private IEmployeeRepository employeeRepository;

    @Override
    @Transactional
    public Employee addEmployee(Employee employee) {
        // Validate employee data
        if (employee.getName() == null || employee.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Employee name cannot be empty");
        }

        // Set default status to active if not specified
        if (employee.getStatus() == null) {
            employee.setStatus("active");
        }

        return employeeRepository.save(employee);
    }

    @Override
    public Employee getEmployeeById(Integer id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    @Override
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Override
    public List<Employee> getAllActiveEmployees() {
        return employeeRepository.findByStatus("active");
    }

    @Override
    @Transactional
    public Employee updateEmployee(Employee employee) {
        // Validate employee exists
        Employee existingEmployee = employeeRepository.findById(employee.getId())
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employee.getId()));

        // Update fields
        existingEmployee.setName(employee.getName());
        existingEmployee.setPhoneNo(employee.getPhoneNo());
        existingEmployee.setAddress(employee.getAddress());
        existingEmployee.setRole(employee.getRole());
        existingEmployee.setBaseSalary(employee.getBaseSalary());
        existingEmployee.setStatus(employee.getStatus());

        // Only update join date if it's provided (to prevent accidental changes)
        if (employee.getJoinDate() != null) {
            existingEmployee.setJoinDate(employee.getJoinDate());
        }

        return employeeRepository.save(existingEmployee);
    }

    @Override
    @Transactional
    public Employee updateEmployeeStatus(Integer id, String status) {
        // Validate status
        if (status == null || !(status.equals("active") || status.equals("inactive"))) {
            throw new IllegalArgumentException("Status must be either 'active' or 'inactive'");
        }

        // Find employee
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        // Update status
        employee.setStatus(status);

        return employeeRepository.save(employee);
    }

    @Override
    @Transactional
    public boolean deleteEmployee(Integer id) {
        if (employeeRepository.existsById(id)) {
            employeeRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    public int getActiveEmployeesCount() {
        return employeeRepository.countByStatus("active").intValue();
    }
}
