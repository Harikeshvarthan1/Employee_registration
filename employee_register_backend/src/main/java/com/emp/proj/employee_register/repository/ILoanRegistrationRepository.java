package com.emp.proj.employee_register.repository;


import com.emp.proj.employee_register.entities.LoanRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface ILoanRegistrationRepository extends JpaRepository<LoanRegistration, Integer> {

    // Find loans by employee ID
    List<LoanRegistration> findByEmployeeId(Integer employeeId);

    // Find active loans by employee ID
    List<LoanRegistration> findByEmployeeIdAndStatus(Integer employeeId, String status);

    // Find all active loans
    List<LoanRegistration> findByStatus(String status);

    // Find loans created in a date range
    List<LoanRegistration> findByLoanDateBetween(Date startDate, Date endDate);

    // Find loans with amount greater than a specific value
    List<LoanRegistration> findByLoanAmountGreaterThanEqual(Double amount);
}
