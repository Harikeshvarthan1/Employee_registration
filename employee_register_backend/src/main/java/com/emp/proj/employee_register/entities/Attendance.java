package com.emp.proj.employee_register.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@AllArgsConstructor
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "emp_id")
    private Integer employeeId;

    @Temporal(TemporalType.DATE)
    private Date date;

    private String status; // "present", "absent", "overtime", "halfday"

    @Column(name = "overtime_description")
    private String overtimeDescription;

    @Column(name = "overtime_salary")
    private Double overtimeSalary;

    @Column(name = "overtime_hours")
    private Double overtimeHours;

    private String description;

    @Column(name = "total_salary")
    private Double totalSalary;

    // Default constructor required by JPA
    public Attendance() {
    }

    // Constructor without ID for entity creation
    public Attendance(Integer employeeId, Date date, String status,
                      String overtimeDescription, Double overtimeSalary, Double overtimeHours,
                      String description, Double totalSalary) {
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        this.overtimeDescription = overtimeDescription;
        this.overtimeSalary = overtimeSalary;
        this.overtimeHours = overtimeHours;
        this.description = description;
        this.totalSalary = totalSalary;
    }

    // Getters and setters
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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOvertimeDescription() {
        return overtimeDescription;
    }

    public void setOvertimeDescription(String overtimeDescription) {
        this.overtimeDescription = overtimeDescription;
    }

    public Double getOvertimeSalary() {
        return overtimeSalary;
    }

    public void setOvertimeSalary(Double overtimeSalary) {
        this.overtimeSalary = overtimeSalary;
    }

    public Double getOvertimeHours() {
        return overtimeHours;
    }

    public void setOvertimeHours(Double overtimeHours) {
        this.overtimeHours = overtimeHours;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getTotalSalary() {
        return totalSalary;
    }

    public void setTotalSalary(Double totalSalary) {
        this.totalSalary = totalSalary;
    }
}
