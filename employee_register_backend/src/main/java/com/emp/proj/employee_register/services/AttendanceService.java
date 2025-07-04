package com.emp.proj.employee_register.services;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.emp.proj.employee_register.entities.Attendance;
import com.emp.proj.employee_register.entities.Employee;
import com.emp.proj.employee_register.repository.IAttendanceRepository;
import com.emp.proj.employee_register.repository.IEmployeeRepository;

import jakarta.transaction.Transactional;

@Service
public class AttendanceService implements IAttendanceService {

    @Autowired
    private IAttendanceRepository attendanceRepository;

    @Autowired
    private IEmployeeRepository employeeRepository;

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

    @Override
    @Transactional
    public Attendance addAttendance(Attendance attendance) {
        
        Employee employee = employeeRepository.findById(attendance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + attendance.getEmployeeId()));

        if (!"active".equals(employee.getStatus())) {
            throw new RuntimeException("Cannot add attendance for inactive employee");
        }

        double baseSalary = employee.getBaseSalary();
        double totalSalary = 0;

        switch (attendance.getStatus()) {
            case "present":
                totalSalary = baseSalary;
                break;
            case "halfday":
                totalSalary = baseSalary / 2;
                break;
            case "overtime":
                totalSalary = baseSalary + (attendance.getOvertimeSalary() != null ? attendance.getOvertimeSalary() : 0);
                break;
            case "absent":
                totalSalary = 0;
                break;
            default:
                throw new IllegalArgumentException("Invalid attendance status. Must be present, absent, overtime, or halfday");
        }

        attendance.setTotalSalary(totalSalary);

        return attendanceRepository.save(attendance);
    }

    @Override
    @Transactional
    public Attendance updateAttendance(Attendance attendance) {
        
        Attendance existingAttendance = attendanceRepository.findById(attendance.getId())
                .orElseThrow(() -> new RuntimeException("Attendance record not found with id: " + attendance.getId()));

        existingAttendance.setStatus(attendance.getStatus());
        existingAttendance.setDescription(attendance.getDescription());

        if (attendance.getOvertimeDescription() != null) {
            existingAttendance.setOvertimeDescription(attendance.getOvertimeDescription());
        }

        if (attendance.getOvertimeSalary() != null) {
            existingAttendance.setOvertimeSalary(attendance.getOvertimeSalary());
        }

        if (attendance.getOvertimeHours() != null) {
            existingAttendance.setOvertimeHours(attendance.getOvertimeHours());
        }

        Employee employee = employeeRepository.findById(existingAttendance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        double baseSalary = employee.getBaseSalary();
        double totalSalary = 0;

        switch (existingAttendance.getStatus()) {
            case "present":
                totalSalary = baseSalary;
                break;
            case "halfday":
                totalSalary = baseSalary / 2;
                break;
            case "overtime":
                totalSalary = baseSalary + (existingAttendance.getOvertimeSalary() != null ? existingAttendance.getOvertimeSalary() : 0);
                break;
            case "absent":
                totalSalary = 0;
                break;
        }

        existingAttendance.setTotalSalary(totalSalary);

        return attendanceRepository.save(existingAttendance);
    }

    @Override
    @Transactional
    public Attendance updateOvertimeDetails(Integer attendanceId, String overtimeDescription, Double overtimeSalary, Double overtimeHours) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with id: " + attendanceId));

        if (!"overtime".equals(attendance.getStatus())) {
            throw new IllegalStateException("Cannot update overtime details for non-overtime attendance");
        }

        attendance.setOvertimeDescription(overtimeDescription);
        attendance.setOvertimeSalary(overtimeSalary);
        attendance.setOvertimeHours(overtimeHours);

        Employee employee = employeeRepository.findById(attendance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        double baseSalary = employee.getBaseSalary();
        double totalSalary = baseSalary + overtimeSalary;

        attendance.setTotalSalary(totalSalary);

        return attendanceRepository.save(attendance);
    }

    @Override
    public List<Attendance> findAll() {
        return attendanceRepository.findAll();
    }

    @Override
    public List<Attendance> getAttendanceByEmployeeId(Integer employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId);
    }

    @Override
    public List<Attendance> getAttendanceByDate(String dateStr) {
        try {
            Date date = dateFormat.parse(dateStr);
            return attendanceRepository.findByDate(date);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Invalid date format. Use yyyy-MM-dd");
        }
    }

    @Override
    public Attendance getAttendanceByEmployeeIdAndDate(Integer employeeId, String dateStr) {
        try {
            Date date = dateFormat.parse(dateStr);
            return attendanceRepository.findByEmployeeIdAndDate(employeeId, date);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Invalid date format. Use yyyy-MM-dd");
        }
    }

    @Override
    public Map<String, Object> getMonthlyAttendanceSummary(Integer employeeId, Integer month, Integer year) {
        
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        List<Attendance> attendanceList = attendanceRepository.findByEmployeeIdAndMonthAndYear(employeeId, month, year);

        int presentDays = 0;
        int absentDays = 0;
        int halfDays = 0;
        int overtimeDays = 0;
        double totalSalary = 0;
        double totalOvertimeSalary = 0;
        double totalOvertimeHours = 0;

        for (Attendance attendance : attendanceList) {
            switch (attendance.getStatus()) {
                case "present":
                    presentDays++;
                    break;
                case "absent":
                    absentDays++;
                    break;
                case "halfday":
                    halfDays++;
                    break;
                case "overtime":
                    overtimeDays++;
                    totalOvertimeSalary += (attendance.getOvertimeSalary() != null ? attendance.getOvertimeSalary() : 0);
                    totalOvertimeHours += (attendance.getOvertimeHours() != null ? attendance.getOvertimeHours() : 0);
                    break;
            }

            totalSalary += (attendance.getTotalSalary() != null ? attendance.getTotalSalary() : 0);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("employeeId", employeeId);
        summary.put("month", month);
        summary.put("year", year);
        summary.put("presentDays", presentDays);
        summary.put("absentDays", absentDays);
        summary.put("halfDays", halfDays);
        summary.put("overtimeDays", overtimeDays);
        summary.put("totalDays", attendanceList.size());
        summary.put("totalSalary", totalSalary);
        summary.put("totalOvertimeSalary", totalOvertimeSalary);
        summary.put("totalOvertimeHours", totalOvertimeHours);

        return summary;
    }

    @Override
    @Transactional
    public boolean deleteAttendance(Integer attendanceId) {
        if (attendanceRepository.existsById(attendanceId)) {
            attendanceRepository.deleteById(attendanceId);
            return true;
        }
        return false;
    }
}
