package com.emp.proj.employee_register.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.emp.proj.employee_register.entities.Salary;
import com.emp.proj.employee_register.services.ISalaryService;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/salaries")
public class SalaryController {

    @Autowired
    private ISalaryService salaryService;

    @PostMapping("")
    public ResponseEntity<Salary> addSalary(@RequestBody Salary salary) {
        Salary createdSalary = salaryService.addSalary(salary);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSalary);
    }

    @GetMapping("")
    public List<Salary> getAllSalaries() {
        return salaryService.getAllSalaries();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Salary> getSalaryById(@PathVariable Integer id) {
        Salary salary = salaryService.getSalaryById(id);
        if (salary != null) {
            return ResponseEntity.ok(salary);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Salary> getSalariesByEmployeeId(@PathVariable int employeeId) {
        return salaryService.getSalariesByEmployeeId(employeeId);
    }

    @GetMapping("/employee/{employeeId}/latest")
    public ResponseEntity<Salary> getLatestSalaryByEmployeeId(@PathVariable int employeeId) {
        Salary salary = salaryService.getLatestSalaryByEmployeeId(employeeId);
        if (salary != null) {
            return ResponseEntity.ok(salary);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getSalaryStatistics() {
        Map<String, Object> statistics = salaryService.getSalaryStatistics();
        return ResponseEntity.ok(statistics);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Salary> updateSalary(@PathVariable int id, @RequestBody Salary salary) {
        try {
            salary.setId(id);
            Salary updatedSalary = salaryService.updateSalary(salary);
            return ResponseEntity.ok(updatedSalary);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalary(@PathVariable Integer id) {
        if (salaryService.deleteSalary(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
