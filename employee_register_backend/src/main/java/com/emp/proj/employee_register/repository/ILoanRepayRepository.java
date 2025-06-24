package com.emp.proj.employee_register.repository;

import com.emp.proj.employee_register.entities.LoanRepay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface ILoanRepayRepository extends JpaRepository<LoanRepay, Integer> {

    // Find repayments by loan ID
    List<LoanRepay> findByLoanId(Integer loanId);

    // Find repayments by employee ID
    List<LoanRepay> findByEmployeeId(Integer employeeId);

    // Find repayments by repay date
    List<LoanRepay> findByRepayDate(Date repayDate);

    // Find repayments by loan ID and repay date
    List<LoanRepay> findByLoanIdAndRepayDate(Integer loanId, Date repayDate);

    // Calculate total repaid amount for a loan
    @Query("SELECT SUM(l.repayAmount) FROM LoanRepay l WHERE l.loanId = :loanId")
    Double getTotalRepaidAmountForLoan(@Param("loanId") Integer loanId);

    // Find repayments during a specific period
    List<LoanRepay> findByRepayDateBetween(Date startDate, Date endDate);
}
