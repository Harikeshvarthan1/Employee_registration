package com.emp.proj.employee_register.services;

import com.emp.proj.employee_register.entities.LoanRepay;
import com.emp.proj.employee_register.entities.LoanRegistration;
import com.emp.proj.employee_register.repository.ILoanRepayRepository;
import com.emp.proj.employee_register.repository.ILoanRegistrationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class LoanRepayService implements ILoanRepayService {

    @Autowired
    private ILoanRepayRepository loanRepayRepository;

    @Autowired
    private ILoanRegistrationRepository loanRegistrationRepository;

    @Override
    @Transactional
    public LoanRepay addRepayment(LoanRepay loanRepay) {
        
        LoanRegistration loan = loanRegistrationRepository.findById(loanRepay.getLoanId())
                .orElseThrow(() -> new RuntimeException("Loan not found with id: " + loanRepay.getLoanId()));

        if (!"active".equals(loan.getStatus())) {
            throw new RuntimeException("Cannot repay an inactive loan");
        }

        if (!loan.getEmployeeId().equals(loanRepay.getEmployeeId())) {
            throw new IllegalArgumentException("Employee ID does not match the loan");
        }

        if (loanRepay.getRepayDate() == null) {
            loanRepay.setRepayDate(new Date());
        }

        if (loanRepay.getRepayAmount() == null || loanRepay.getRepayAmount() <= 0) {
            throw new IllegalArgumentException("Repay amount must be greater than zero");
        }

        Double totalRepaid = loanRepayRepository.getTotalRepaidAmountForLoan(loanRepay.getLoanId());
        if (totalRepaid == null) totalRepaid = 0.0;

        if (totalRepaid + loanRepay.getRepayAmount() > loan.getLoanAmount()) {
            throw new IllegalArgumentException(
                    "Repayment would exceed loan amount. Maximum allowed: " +
                            (loan.getLoanAmount() - totalRepaid)
            );
        }

        LoanRepay savedRepayment = loanRepayRepository.save(loanRepay);

        if (totalRepaid + loanRepay.getRepayAmount() >= loan.getLoanAmount()) {
            loan.setStatus("inactive");
            loanRegistrationRepository.save(loan);
        }

        return savedRepayment;
    }

    @Override
    public LoanRepay getRepaymentById(Integer id) {
        return loanRepayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan repayment not found with id: " + id));
    }

    @Override
    public List<LoanRepay> getAllRepayments() {
        return loanRepayRepository.findAll();
    }

    @Override
    public List<LoanRepay> getRepaymentsByLoanId(Integer loanId) {
        return loanRepayRepository.findByLoanId(loanId);
    }

    @Override
    public List<LoanRepay> getRepaymentsByEmployeeId(Integer employeeId) {
        return loanRepayRepository.findByEmployeeId(employeeId);
    }

    @Override
    @Transactional
    public LoanRepay updateRepayment(LoanRepay loanRepay) {
        
        LoanRepay existingRepayment = loanRepayRepository.findById(loanRepay.getId())
                .orElseThrow(() -> new RuntimeException("Repayment not found with id: " + loanRepay.getId()));

        LoanRegistration loan = loanRegistrationRepository.findById(existingRepayment.getLoanId())
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        Double totalRepaid = loanRepayRepository.getTotalRepaidAmountForLoan(existingRepayment.getLoanId());
        if (totalRepaid == null) totalRepaid = 0.0;
        totalRepaid -= existingRepayment.getRepayAmount();

        if (totalRepaid + loanRepay.getRepayAmount() > loan.getLoanAmount()) {
            throw new IllegalArgumentException(
                    "Repayment would exceed loan amount. Maximum allowed: " +
                            (loan.getLoanAmount() - totalRepaid)
            );
        }

        existingRepayment.setRepayAmount(loanRepay.getRepayAmount());

        if (loanRepay.getRepayDate() != null) {
            existingRepayment.setRepayDate(loanRepay.getRepayDate());
        }

        LoanRepay updatedRepayment = loanRepayRepository.save(existingRepayment);

        totalRepaid += loanRepay.getRepayAmount();
        if (totalRepaid >= loan.getLoanAmount()) {
            loan.setStatus("inactive");
        } else {
            loan.setStatus("active");
        }
        loanRegistrationRepository.save(loan);

        return updatedRepayment;
    }

    @Override
    @Transactional
    public boolean deleteRepayment(Integer id) {
        
        LoanRepay repayment = loanRepayRepository.findById(id)
                .orElse(null);

        if (repayment == null) {
            return false;
        }

        LoanRegistration loan = loanRegistrationRepository.findById(repayment.getLoanId())
                .orElse(null);

        loanRepayRepository.deleteById(id);

        if (loan != null) {
            Double totalRepaid = loanRepayRepository.getTotalRepaidAmountForLoan(loan.getLoanId());
            if (totalRepaid == null) totalRepaid = 0.0;

            if (totalRepaid < loan.getLoanAmount() && "inactive".equals(loan.getStatus())) {
                loan.setStatus("active");
                loanRegistrationRepository.save(loan);
            }
        }

        return true;
    }

    @Override
    public Double getTotalRepaidForLoan(Integer loanId) {
        Double total = loanRepayRepository.getTotalRepaidAmountForLoan(loanId);
        return total != null ? total : 0.0;
    }
}
