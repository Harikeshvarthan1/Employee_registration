package com.emp.proj.employee_register.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.Salary;

@Repository
public interface ISalaryRepository extends JpaRepository<Salary, Integer> {

    List<Salary> findByEmployeeId(Integer employeeId);

    List<Salary> findByPaymentType(String paymentType);

    List<Salary> findByDatePaid(Date datePaid);

    @Query("SELECT s FROM Salary s WHERE s.employeeId = :employeeId ORDER BY s.datePaid DESC")
    List<Salary> findLatestByEmployeeId(@Param("employeeId") Integer employeeId);

    Optional<Salary> findFirstByEmployeeIdOrderByDatePaidDesc(Integer employeeId);

    @Query("SELECT SUM(s.amount) FROM Salary s WHERE s.employeeId = :employeeId AND s.datePaid BETWEEN :startDate AND :endDate")
    Double sumSalaryForEmployeeInPeriod(
            @Param("employeeId") Integer employeeId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate
    );
}
