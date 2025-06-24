package com.emp.proj.employee_register.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@AllArgsConstructor
@Table(name = "loan_repayments")
public class LoanRepay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "loan_id")
    private Integer loanId;

    @Column(name = "emp_id")
    private Integer employeeId;

    @Column(name = "repay_amount")
    private Double repayAmount;

    @Temporal(TemporalType.DATE)
    @Column(name = "repay_date")
    private Date repayDate;

    // Default constructor required by JPA
    public LoanRepay() {
    }

    // Constructor without ID for entity creation
    public LoanRepay(Integer loanId, Integer employeeId, Double repayAmount, Date repayDate) {
        this.loanId = loanId;
        this.employeeId = employeeId;
        this.repayAmount = repayAmount;
        this.repayDate = repayDate;
    }

    // Getters and setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

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

    public Double getRepayAmount() {
        return repayAmount;
    }

    public void setRepayAmount(Double repayAmount) {
        this.repayAmount = repayAmount;
    }

    public Date getRepayDate() {
        return repayDate;
    }

    public void setRepayDate(Date repayDate) {
        this.repayDate = repayDate;
    }
}
