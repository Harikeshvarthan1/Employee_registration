package com.emp.proj.employee_register.repository;

import com.emp.proj.employee_register.entities.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IEmployeeRepository extends JpaRepository<Employee, Integer> {

    // Find employees by their status
    List<Employee> findByStatus(String status);

    // Find employees by role
    List<Employee> findByRole(String role);

    // Find employees by name containing the search term (for search functionality)
    List<Employee> findByNameContaining(String searchTerm);

    // Count active employees
    Long countByStatus(String status);
}
