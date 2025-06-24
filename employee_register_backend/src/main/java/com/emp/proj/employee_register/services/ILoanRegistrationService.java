package com.emp.proj.employee_register.services;

import java.util.List;

import com.emp.proj.employee_register.entities.LoanRegistration;

public interface ILoanRegistrationService {
    LoanRegistration registerLoan(LoanRegistration loanRegistration);
    LoanRegistration getLoanById(Integer id);
    List<LoanRegistration> getAllLoans();
    List<LoanRegistration> getActiveLoans();
    List<LoanRegistration> getLoansByEmployeeId(Integer employeeId);
    List<LoanRegistration> getActiveLoansByEmployeeId(Integer employeeId);
    LoanRegistration updateLoan(LoanRegistration loan);
    LoanRegistration updateLoanStatus(Integer id, String status);
    boolean deleteLoan(Integer id);
}
