package com.emp.proj.employee_register.controller;

import com.emp.proj.employee_register.entities.Attendance;
import com.emp.proj.employee_register.services.IAttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    @Autowired
    private IAttendanceService attendanceService;

    @PostMapping("")
    public ResponseEntity<Attendance> addAttendance(@RequestBody Attendance attendance) {
        Attendance createdAttendance = attendanceService.addAttendance(attendance);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAttendance);
    }

    @PutMapping("/{attendanceId}")
    public ResponseEntity<Attendance> updateAttendance(@PathVariable int attendanceId, @RequestBody Attendance attendance) {
        try {
            attendance.setId(attendanceId);
            Attendance updatedAttendance = attendanceService.updateAttendance(attendance);
            return ResponseEntity.ok(updatedAttendance);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("")
    public List<Attendance> getAllAttendance() {
        return attendanceService.findAll();
    }

    @GetMapping("/employee/{employeeId}")
    public List<Attendance> getAttendanceByEmployeeId(@PathVariable int employeeId) {
        return attendanceService.getAttendanceByEmployeeId(employeeId);
    }

    @GetMapping("/date/{date}")
    public List<Attendance> getAttendanceByDate(@PathVariable String date) {
        return attendanceService.getAttendanceByDate(date);
    }

    @GetMapping("/employee/{employeeId}/date/{date}")
    public ResponseEntity<Attendance> getAttendanceByEmployeeIdAndDate(@PathVariable int employeeId, @PathVariable String date) {
        Attendance attendance = attendanceService.getAttendanceByEmployeeIdAndDate(employeeId, date);
        if (attendance != null) {
            return ResponseEntity.ok(attendance);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    @PutMapping("/{attendanceId}/overtime")
    public ResponseEntity<Attendance> updateOvertimeDetails(
            @PathVariable int attendanceId,
            @RequestBody Map<String, Object> payload) {

        String overtimeDescription = (String) payload.get("overtimeDescription");
        Double overtimeSalary = Double.valueOf(payload.get("overtimeSalary").toString());
        Double overtimeHours = payload.get("overtimeHours") != null ? Double.valueOf(payload.get("overtimeHours").toString()) : 0.0;

        try {
            Attendance updatedAttendance = attendanceService.updateOvertimeDetails(attendanceId, overtimeDescription, overtimeSalary, overtimeHours);
            return ResponseEntity.ok(updatedAttendance);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/monthly/{employeeId}/{month}/{year}")
    public ResponseEntity<Map<String, Object>> getMonthlyAttendanceSummary(
            @PathVariable int employeeId,
            @PathVariable int month,
            @PathVariable int year) {
        Map<String, Object> summary = attendanceService.getMonthlyAttendanceSummary(employeeId, month, year);
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/{attendanceId}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Integer attendanceId) {
        if (attendanceService.deleteAttendance(attendanceId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
