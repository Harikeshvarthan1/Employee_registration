package com.emp.proj.employee_register.services;

import com.emp.proj.employee_register.entities.LoanRegistration;
import com.emp.proj.employee_register.entities.Employee;
import com.emp.proj.employee_register.repository.ILoanRegistrationRepository;
import com.emp.proj.employee_register.repository.IEmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class LoanRegistrationService implements ILoanRegistrationService {

    @Autowired
    private ILoanRegistrationRepository loanRegistrationRepository;

    @Autowired
    private IEmployeeRepository employeeRepository;

    @Override
    @Transactional
    public LoanRegistration registerLoan(LoanRegistration loanRegistration) {
        // Validate employee exists and is active
        Employee employee = employeeRepository.findById(loanRegistration.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + loanRegistration.getEmployeeId()));

        if (!"active".equals(employee.getStatus())) {
            throw new RuntimeException("Cannot register loan for inactive employee");
        }

        // Set current date if not provided
        if (loanRegistration.getLoanDate() == null) {
            loanRegistration.setLoanDate(new Date());
        }

        // Set default status as active if not provided
        if (loanRegistration.getStatus() == null) {
            loanRegistration.setStatus("active");
        }

        // Validate loan amount
        if (loanRegistration.getLoanAmount() == null || loanRegistration.getLoanAmount() <= 0) {
            throw new IllegalArgumentException("Loan amount must be greater than zero");
        }

        return loanRegistrationRepository.save(loanRegistration);
    }

    @Override
    public LoanRegistration getLoanById(Integer id) {
        return loanRegistrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + id));
    }

    @Override
    public List<LoanRegistration> getAllLoans() {
        return loanRegistrationRepository.findAll();
    }

    @Override
    public List<LoanRegistration> getActiveLoans() {
        return loanRegistrationRepository.findByStatus("active");
    }

    @Override
    public List<LoanRegistration> getLoansByEmployeeId(Integer employeeId) {
        return loanRegistrationRepository.findByEmployeeId(employeeId);
    }

    @Override
    public List<LoanRegistration> getActiveLoansByEmployeeId(Integer employeeId) {
        return loanRegistrationRepository.findByEmployeeIdAndStatus(employeeId, "active");
    }

    @Override
    @Transactional
    public LoanRegistration updateLoan(LoanRegistration loan) {
        // Check if loan exists
        LoanRegistration existingLoan = loanRegistrationRepository.findById(loan.getLoanId())
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + loan.getLoanId()));

        // Update fields
        existingLoan.setLoanAmount(loan.getLoanAmount());
        existingLoan.setReason(loan.getReason());
        existingLoan.setStatus(loan.getStatus());

        // Only update date if provided
        if (loan.getLoanDate() != null) {
            existingLoan.setLoanDate(loan.getLoanDate());
        }

        return loanRegistrationRepository.save(existingLoan);
    }

    @Override
    @Transactional
    public LoanRegistration updateLoanStatus(Integer id, String status) {
        // Validate status
        if (status == null || !(status.equals("active") || status.equals("inactive"))) {
            throw new IllegalArgumentException("Status must be either 'active' or 'inactive'");
        }

        // Find loan
        LoanRegistration loan = loanRegistrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + id));

        // Update status
        loan.setStatus(status);

        return loanRegistrationRepository.save(loan);
    }

    @Override
    @Transactional
    public boolean deleteLoan(Integer id) {
        if (loanRegistrationRepository.existsById(id)) {
            loanRegistrationRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
