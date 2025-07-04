package com.emp.proj.employee_register.entities;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;

@Entity
@AllArgsConstructor
@Table(name = "salaries")
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "emp_id")
    private Integer employeeId;

    @Temporal(TemporalType.DATE)
    @Column(name = "date_paid")
    private Date datePaid;

    @Column(name = "payment_type")
    private String paymentType;

    private Double amount;

    @Temporal(TemporalType.DATE)
    @Column(name = "last_salary_date")
    private Date lastSalaryDate;

    public Salary() {
    }

    public Salary(Integer employeeId, Date datePaid, String paymentType,
                  Double amount, Date lastSalaryDate) {
        this.employeeId = employeeId;
        this.datePaid = datePaid;
        this.paymentType = paymentType;
        this.amount = amount;
        this.lastSalaryDate = lastSalaryDate;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public Date getDatePaid() {
        return datePaid;
    }

    public void setDatePaid(Date datePaid) {
        this.datePaid = datePaid;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Date getLastSalaryDate() {
        return lastSalaryDate;
    }

    public void setLastSalaryDate(Date lastSalaryDate) {
        this.lastSalaryDate = lastSalaryDate;
    }
}
