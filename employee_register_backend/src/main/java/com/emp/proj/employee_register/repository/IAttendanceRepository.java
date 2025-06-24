package com.emp.proj.employee_register.repository;

import com.emp.proj.employee_register.entities.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface IAttendanceRepository extends JpaRepository<Attendance, Integer> {

    // Find attendance records by employee ID
    List<Attendance> findByEmployeeId(Integer employeeId);

    // Find attendance records by date
    List<Attendance> findByDate(Date date);

    // Find attendance records by employee ID and date
    Attendance findByEmployeeIdAndDate(Integer employeeId, Date date);

    // Find attendance records by employee ID and status
    List<Attendance> findByEmployeeIdAndStatus(Integer employeeId, String status);

    // Find attendance records by status
    List<Attendance> findByStatus(String status);

    // Find attendance records for a specific month and year for an employee
    @Query("SELECT a FROM Attendance a WHERE a.employeeId = :employeeId AND MONTH(a.date) = :month AND YEAR(a.date) = :year")
    List<Attendance> findByEmployeeIdAndMonthAndYear(
            @Param("employeeId") Integer employeeId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );
}
