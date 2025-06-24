package com.emp.proj.employee_register.controller;

import com.emp.proj.employee_register.entities.LoanRegistration;
import com.emp.proj.employee_register.services.ILoanRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/loans")
public class LoanRegistrationController {

    @Autowired
    private ILoanRegistrationService loanRegistrationService;

    @PostMapping("")
    public ResponseEntity<LoanRegistration> registerLoan(@RequestBody LoanRegistration loanRegistration) {
        LoanRegistration registeredLoan = loanRegistrationService.registerLoan(loanRegistration);
        return ResponseEntity.status(HttpStatus.CREATED).body(registeredLoan);
    }

    @GetMapping("")
    public List<LoanRegistration> getAllLoans() {
        return loanRegistrationService.getAllLoans();
    }

    @GetMapping("/active")
    public List<LoanRegistration> getAllActiveLoans() {
        return loanRegistrationService.getActiveLoans();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanRegistration> getLoanById(@PathVariable Integer id) {
        LoanRegistration loan = loanRegistrationService.getLoanById(id);
        if (loan != null) {
            return ResponseEntity.ok(loan);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @GetMapping("/employee/{employeeId}")
    public List<LoanRegistration> getLoansByEmployeeId(@PathVariable int employeeId) {
        return loanRegistrationService.getLoansByEmployeeId(employeeId);
    }

    @GetMapping("/employee/{employeeId}/active")
    public List<LoanRegistration> getActiveLoansByEmployeeId(@PathVariable int employeeId) {
        return loanRegistrationService.getActiveLoansByEmployeeId(employeeId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LoanRegistration> updateLoan(@PathVariable int id, @RequestBody LoanRegistration loan) {
        try {
            loan.setLoanId(id);
            LoanRegistration updatedLoan = loanRegistrationService.updateLoan(loan);
            return ResponseEntity.ok(updatedLoan);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<LoanRegistration> updateLoanStatus(@PathVariable int id, @RequestBody String status) {
        try {
            LoanRegistration updatedLoan = loanRegistrationService.updateLoanStatus(id, status);
            return ResponseEntity.ok(updatedLoan);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoan(@PathVariable Integer id) {
        if (loanRegistrationService.deleteLoan(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
