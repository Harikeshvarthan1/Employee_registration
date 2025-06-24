package com.emp.proj.employee_register.services;

import java.util.List;
import java.util.Map;

import com.emp.proj.employee_register.entities.Attendance;

public interface IAttendanceService {
    Attendance addAttendance(Attendance attendance);
    Attendance updateAttendance(Attendance attendance);
    Attendance updateOvertimeDetails(Integer attendanceId, String overtimeDescription, Double overtimeSalary, Double overtimeHours);
    List<Attendance> findAll();
    List<Attendance> getAttendanceByEmployeeId(Integer employeeId);
    List<Attendance> getAttendanceByDate(String date);
    Attendance getAttendanceByEmployeeIdAndDate(Integer employeeId, String date);
    Map<String, Object> getMonthlyAttendanceSummary(Integer employeeId, Integer month, Integer year);
    boolean deleteAttendance(Integer attendanceId);
}
