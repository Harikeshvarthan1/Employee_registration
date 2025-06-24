package com.emp.proj.employee_register.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.LoanRepay;

@Repository
public interface ILoanRepayRepository extends JpaRepository<LoanRepay, Integer> {

    List<LoanRepay> findByLoanId(Integer loanId);

    List<LoanRepay> findByEmployeeId(Integer employeeId);

    List<LoanRepay> findByRepayDate(Date repayDate);

    List<LoanRepay> findByLoanIdAndRepayDate(Integer loanId, Date repayDate);

    @Query("SELECT SUM(l.repayAmount) FROM LoanRepay l WHERE l.loanId = :loanId")
    Double getTotalRepaidAmountForLoan(@Param("loanId") Integer loanId);

    List<LoanRepay> findByRepayDateBetween(Date startDate, Date endDate);
}
