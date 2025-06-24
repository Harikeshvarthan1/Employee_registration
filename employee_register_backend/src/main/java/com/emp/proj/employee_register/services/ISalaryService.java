package com.emp.proj.employee_register.services;

import java.util.List;
import java.util.Map;

import com.emp.proj.employee_register.entities.Salary;

public interface ISalaryService {
    Salary addSalary(Salary salary);
    Salary getSalaryById(Integer id);
    List<Salary> getAllSalaries();
    List<Salary> getSalariesByEmployeeId(Integer employeeId);
    Salary getLatestSalaryByEmployeeId(Integer employeeId);
    Salary updateSalary(Salary salary);
    boolean deleteSalary(Integer id);

    Map<String, Object> getSalaryStatistics();
}