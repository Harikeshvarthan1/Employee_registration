package com.emp.proj.employee_register.repository;


import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.LoanRegistration;

@Repository
public interface ILoanRegistrationRepository extends JpaRepository<LoanRegistration, Integer> {

    List<LoanRegistration> findByEmployeeId(Integer employeeId);

    List<LoanRegistration> findByEmployeeIdAndStatus(Integer employeeId, String status);

    List<LoanRegistration> findByStatus(String status);

    List<LoanRegistration> findByLoanDateBetween(Date startDate, Date endDate);

    List<LoanRegistration> findByLoanAmountGreaterThanEqual(Double amount);
}
