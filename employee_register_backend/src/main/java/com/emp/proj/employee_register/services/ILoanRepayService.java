package com.emp.proj.employee_register.services;

import java.util.List;

import com.emp.proj.employee_register.entities.LoanRepay;

public interface ILoanRepayService {
    LoanRepay addRepayment(LoanRepay loanRepay);
    LoanRepay getRepaymentById(Integer id);
    List<LoanRepay> getAllRepayments();
    List<LoanRepay> getRepaymentsByLoanId(Integer loanId);
    List<LoanRepay> getRepaymentsByEmployeeId(Integer employeeId);
    LoanRepay updateRepayment(LoanRepay loanRepay);
    boolean deleteRepayment(Integer id);
    Double getTotalRepaidForLoan(Integer loanId);
}
