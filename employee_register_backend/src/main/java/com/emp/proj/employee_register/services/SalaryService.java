package com.emp.proj.employee_register.services;
import java.util.HashMap;
import com.emp.proj.employee_register.entities.Salary;
import com.emp.proj.employee_register.repository.ISalaryRepository;
import com.emp.proj.employee_register.repository.IEmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class SalaryService implements ISalaryService {

    @Autowired
    private ISalaryRepository salaryRepository;

    @Autowired
    private IEmployeeRepository employeeRepository;

    @Override
    @Transactional
    public Salary addSalary(Salary salary) {
        // Validate employee exists
        employeeRepository.findById(salary.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + salary.getEmployeeId()));

        // Set current date if not provided
        if (salary.getDatePaid() == null) {
            salary.setDatePaid(new Date());
        }

        // Validate payment type
        if (salary.getPaymentType() == null ||
                !(salary.getPaymentType().equals("daily_credit") || salary.getPaymentType().equals("salary"))) {
            throw new IllegalArgumentException("Payment type must be either 'daily_credit' or 'salary'");
        }

        return salaryRepository.save(salary);
    }

    // Add this method to your SalaryService class
    @Override
    public Map<String, Object> getSalaryStatistics() {
        Map<String, Object> statistics = new HashMap<>();

        // Get all salaries
        List<Salary> allSalaries = salaryRepository.findAll();

        // Calculate total amount paid
        double totalPaid = allSalaries.stream()
                .mapToDouble(Salary::getAmount)
                .sum();

        // Get current month and year
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();
        int lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int lastMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        // Calculate this month's amount
        double thisMonthAmount = allSalaries.stream()
                .filter(salary -> {
                    LocalDate paidDate = LocalDate.parse(new SimpleDateFormat("yyyy-MM-dd").format(salary.getDatePaid()));
                    return paidDate.getMonthValue() == currentMonth && paidDate.getYear() == currentYear;
                })
                .mapToDouble(Salary::getAmount)
                .sum();

        // Calculate last month's amount
        double lastMonthAmount = allSalaries.stream()
                .filter(salary -> {
                    LocalDate paidDate = LocalDate.parse(new SimpleDateFormat("yyyy-MM-dd").format(salary.getDatePaid()));
                    return paidDate.getMonthValue() == lastMonth && paidDate.getYear() == lastMonthYear;
                })
                .mapToDouble(Salary::getAmount)
                .sum();

        // Get recent payments (last 10)
        List<Salary> recentPayments = allSalaries.stream()
                .sorted(Comparator.comparing(Salary::getDatePaid).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // Calculate monthly data for chart (last 6 months)
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(i);
            int month = yearMonth.getMonthValue();
            int year = yearMonth.getYear();

            double amount = allSalaries.stream()
                    .filter(salary -> {
                        LocalDate paidDate = LocalDate.parse(new SimpleDateFormat("yyyy-MM-dd").format(salary.getDatePaid()));
                        return paidDate.getMonthValue() == month && paidDate.getYear() == year;
                    })
                    .mapToDouble(Salary::getAmount)
                    .sum();

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("name", yearMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            monthData.put("amount", amount);
            monthlyData.add(monthData);
        }

        // Build the statistics object
        statistics.put("totalPaid", totalPaid);
        statistics.put("thisMonth", thisMonthAmount);
        statistics.put("lastMonth", lastMonthAmount);
        statistics.put("recentPayments", recentPayments);
        statistics.put("monthlyData", monthlyData);

        return statistics;
    }

    @Override
    public Salary getSalaryById(Integer id) {
        return salaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary record not found with id: " + id));
    }

    @Override
    public List<Salary> getAllSalaries() {
        return salaryRepository.findAll();
    }

    @Override
    public List<Salary> getSalariesByEmployeeId(Integer employeeId) {
        return salaryRepository.findByEmployeeId(employeeId);
    }

    @Override
    public Salary getLatestSalaryByEmployeeId(Integer employeeId) {
        return salaryRepository.findFirstByEmployeeIdOrderByDatePaidDesc(employeeId)
                .orElseThrow(() -> new RuntimeException("No salary records found for employee with id: " + employeeId));
    }

    @Override
    @Transactional
    public Salary updateSalary(Salary salary) {
        // Check if salary record exists
        Salary existingSalary = salaryRepository.findById(salary.getId())
                .orElseThrow(() -> new RuntimeException("Salary record not found with id: " + salary.getId()));

        // Update fields
        existingSalary.setAmount(salary.getAmount());
        existingSalary.setPaymentType(salary.getPaymentType());

        // Only update dates if they are provided
        if (salary.getDatePaid() != null) {
            existingSalary.setDatePaid(salary.getDatePaid());
        }

        if (salary.getLastSalaryDate() != null) {
            existingSalary.setLastSalaryDate(salary.getLastSalaryDate());
        }

        return salaryRepository.save(existingSalary);
    }

    @Override
    @Transactional
    public boolean deleteSalary(Integer id) {
        if (salaryRepository.existsById(id)) {
            salaryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
