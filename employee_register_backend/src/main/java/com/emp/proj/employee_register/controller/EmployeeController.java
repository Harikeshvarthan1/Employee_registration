package com.emp.proj.employee_register.controller;

import com.emp.proj.employee_register.entities.Employee;
import com.emp.proj.employee_register.services.IEmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    @Autowired
    private IEmployeeService employeeService;

    @PostMapping("")
    public ResponseEntity<Employee> addEmployee(@RequestBody Employee employee) {
        // Employee id will be generated automatically by the database.
        Employee createdEmployee = employeeService.addEmployee(employee);
        return ResponseEntity.ok(createdEmployee);
    }

    @GetMapping("")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        List<Employee> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Employee>> getAllActiveEmployees() {
        List<Employee> employees = employeeService.getAllActiveEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Integer id) {
        Employee employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable int id, @RequestBody Employee employee) {
        try {
            employee.setId(id);
            Employee updatedEmployee = employeeService.updateEmployee(employee);
            return ResponseEntity.ok(updatedEmployee);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Employee> updateEmployeeStatus(@PathVariable int id, @RequestBody String status) {
        try {
            Employee updatedEmployee = employeeService.updateEmployeeStatus(id, status);
            return ResponseEntity.ok(updatedEmployee);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public String deleteEmployee(@PathVariable Integer id) {
        if (employeeService.deleteEmployee(id)) {
            return "Employee successfully deleted";
        }
        return "Employee Not Found";
    }
}
