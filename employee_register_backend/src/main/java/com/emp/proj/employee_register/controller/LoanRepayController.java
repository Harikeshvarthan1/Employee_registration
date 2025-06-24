package com.emp.proj.employee_register.controller;

import com.emp.proj.employee_register.entities.LoanRepay;
import com.emp.proj.employee_register.services.ILoanRepayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/loan-repayments")
public class LoanRepayController {

    @Autowired
    private ILoanRepayService loanRepayService;

    @PostMapping("")
    public ResponseEntity<LoanRepay> addRepayment(@RequestBody LoanRepay loanRepay) {
        LoanRepay createdRepayment = loanRepayService.addRepayment(loanRepay);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRepayment);
    }

    @GetMapping("")
    public List<LoanRepay> getAllRepayments() {
        return loanRepayService.getAllRepayments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanRepay> getRepaymentById(@PathVariable Integer id) {
        LoanRepay repayment = loanRepayService.getRepaymentById(id);
        if (repayment != null) {
            return ResponseEntity.ok(repayment);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @GetMapping("/loan/{loanId}")
    public List<LoanRepay> getRepaymentsByLoanId(@PathVariable int loanId) {
        return loanRepayService.getRepaymentsByLoanId(loanId);
    }

    @GetMapping("/employee/{employeeId}")
    public List<LoanRepay> getRepaymentsByEmployeeId(@PathVariable int employeeId) {
        return loanRepayService.getRepaymentsByEmployeeId(employeeId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LoanRepay> updateRepayment(@PathVariable int id, @RequestBody LoanRepay loanRepay) {
        try {
            loanRepay.setId(id);
            LoanRepay updatedRepayment = loanRepayService.updateRepayment(loanRepay);
            return ResponseEntity.ok(updatedRepayment);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepayment(@PathVariable Integer id) {
        if (loanRepayService.deleteRepayment(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
