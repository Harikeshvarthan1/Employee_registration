package com.emp.proj.employee_register.repository;

import com.emp.proj.employee_register.entities.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ISalaryRepository extends JpaRepository<Salary, Integer> {

    // Find salaries by employee ID
    List<Salary> findByEmployeeId(Integer employeeId);

    // Find salaries by payment type
    List<Salary> findByPaymentType(String paymentType);

    // Find salaries by date paid
    List<Salary> findByDatePaid(Date datePaid);

    // Find latest salary record for an employee
    @Query("SELECT s FROM Salary s WHERE s.employeeId = :employeeId ORDER BY s.datePaid DESC")
    List<Salary> findLatestByEmployeeId(@Param("employeeId") Integer employeeId);

    // Alternative method to find latest salary using Spring Data naming conventions
    Optional<Salary> findFirstByEmployeeIdOrderByDatePaidDesc(Integer employeeId);

    // Find total salary paid to an employee during a specific period
    @Query("SELECT SUM(s.amount) FROM Salary s WHERE s.employeeId = :employeeId AND s.datePaid BETWEEN :startDate AND :endDate")
    Double sumSalaryForEmployeeInPeriod(
            @Param("employeeId") Integer employeeId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate
    );
}
