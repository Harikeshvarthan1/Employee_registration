package com.emp.proj.employee_register.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.Attendance;

@Repository
public interface IAttendanceRepository extends JpaRepository<Attendance, Integer> {

    List<Attendance> findByEmployeeId(Integer employeeId);

    List<Attendance> findByDate(Date date);

    Attendance findByEmployeeIdAndDate(Integer employeeId, Date date);

    List<Attendance> findByEmployeeIdAndStatus(Integer employeeId, String status);

    List<Attendance> findByStatus(String status);

    @Query("SELECT a FROM Attendance a WHERE a.employeeId = :employeeId AND MONTH(a.date) = :month AND YEAR(a.date) = :year")
    List<Attendance> findByEmployeeIdAndMonthAndYear(
            @Param("employeeId") Integer employeeId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );
}
