package com.emp.proj.employee_register.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.Employee;

@Repository
public interface IEmployeeRepository extends JpaRepository<Employee, Integer> {

    List<Employee> findByStatus(String status);

    List<Employee> findByRole(String role);

    List<Employee> findByNameContaining(String searchTerm);

    Long countByStatus(String status);
}
