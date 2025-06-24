package com.emp.proj.employee_register.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@AllArgsConstructor
@Table(name = "loan_registrations")
public class LoanRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Integer loanId;

    @Column(name = "emp_id")
    private Integer employeeId;

    @Temporal(TemporalType.DATE)
    @Column(name = "loan_date")
    private Date loanDate;

    @Column(name = "loan_amount")
    private Double loanAmount;

    private String reason;

    private String status; // "active" or "inactive"

    // Default constructor required by JPA
    public LoanRegistration() {
    }

    // Constructor without ID for entity creation
    public LoanRegistration(Integer employeeId, Date loanDate,
                            Double loanAmount, String reason, String status) {
        this.employeeId = employeeId;
        this.loanDate = loanDate;
        this.loanAmount = loanAmount;
        this.reason = reason;
        this.status = status;
    }

    // Getters and setters
    public Integer getLoanId() {
        return loanId;
    }

    public void setLoanId(Integer loanId) {
        this.loanId = loanId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public Date getLoanDate() {
        return loanDate;
    }

    public void setLoanDate(Date loanDate) {
        this.loanDate = loanDate;
    }

    public Double getLoanAmount() {
        return loanAmount;
    }

    public void setLoanAmount(Double loanAmount) {
        this.loanAmount = loanAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
