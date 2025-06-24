package com.emp.proj.employee_register.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@AllArgsConstructor
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String phoneNo;
    private String address;
    private String role;

    @Temporal(TemporalType.DATE)
    private Date joinDate;

    private Double baseSalary;
    private String status; // "active" or "inactive"

    // Default constructor required by JPA
    public Employee() {
    }

    // Constructor without ID for entity creation
    public Employee(String name, String phoneNo, String address, String role,
                    Date joinDate, Double baseSalary, String status) {
        this.name = name;
        this.phoneNo = phoneNo;
        this.address = address;
        this.role = role;
        this.joinDate = joinDate;
        this.baseSalary = baseSalary;
        this.status = status;
    }

    // Getters and setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhoneNo() {
        return phoneNo;
    }

    public void setPhoneNo(String phoneNo) {
        this.phoneNo = phoneNo;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Date getJoinDate() {
        return joinDate;
    }

    public void setJoinDate(Date joinDate) {
        this.joinDate = joinDate;
    }

    public Double getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(Double baseSalary) {
        this.baseSalary = baseSalary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
