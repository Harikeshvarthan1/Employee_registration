package com.emp.proj.employee_register.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send a user registration confirmation email.
     *
     * @param toEmail     The recipient's email address.
     * @param userName    The username of the registered user.
     * @param password    The user's initial password.
     * @throws MessagingException If there is an error with the email sending process.
     */
    public void sendUserRegistrationEmail(String toEmail, String userName, String password) throws MessagingException {
        try {
            System.out.println("Preparing to send user registration email to: " + toEmail);

            String subject = "Welcome to Employee Management System";
            String htmlContent = constructUserRegistrationEmailContent(userName, password);

            sendEmail(toEmail, subject, htmlContent);

            System.out.println("Email content prepared successfully for: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending user registration email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        } catch (Exception e) {
            System.err.println("Unexpected error during email preparation: " + e.getMessage());
            e.printStackTrace();
            throw new MessagingException("Failed to prepare email: " + e.getMessage(), e);
        }
    }

    /**
     * Send a salary payment notification email.
     *
     * @param toEmail     The recipient's email address.
     * @param userName    The name of the user.
     * @param amount      The salary amount paid.
     * @param paymentDate The date of payment.
     * @throws MessagingException If there is an error with the email sending process.
     */
    public void sendSalaryNotificationEmail(String toEmail, String userName, double amount, Date paymentDate) throws MessagingException {
        try {
            System.out.println("Preparing to send salary notification email to: " + toEmail);

            String dateStr = new SimpleDateFormat("dd MMM yyyy").format(paymentDate);
            String subject = "Salary Payment Notification";
            String htmlContent = constructSalaryNotificationContent(userName, amount, dateStr);

            sendEmail(toEmail, subject, htmlContent);

            System.out.println("Email content prepared successfully for: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Error sending salary notification email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        } catch (Exception e) {
            System.err.println("Unexpected error during email preparation: " + e.getMessage());
            e.printStackTrace();
            throw new MessagingException("Failed to prepare email: " + e.getMessage(), e);
        }
    }

    /**
     * Construct HTML content for the user registration email.
     */
    private String constructUserRegistrationEmailContent(String userName, String password) {
        String currentYear = new SimpleDateFormat("yyyy").format(new Date());

        return "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "    <title>Welcome to Employee Management System</title>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background-color: #4a7acd; color: white; padding: 20px; text-align: center; }" +
                "        .content { padding: 20px; background-color: #f9f9f9; }" +
                "        .credentials { background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }" +
                "        .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #777; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h1>Welcome to Employee Management System</h1>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Hello " + userName + ",</p>" +
                "            <p>Your account has been successfully created in our Employee Management System.</p>" +
                "            <p>Here are your login credentials:</p>" +
                "            <div class=\"credentials\">" +
                "                <p><strong>Username:</strong> " + userName + "</p>" +
                "                <p><strong>Password:</strong> " + password + "</p>" +
                "            </div>" +
                "            <p>Please login to the system and change your password as soon as possible.</p>" +
                "            <p>If you have any questions, please contact your administrator.</p>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>&copy; " + currentYear + " Employee Management System. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Construct HTML content for the salary notification email.
     */
    private String constructSalaryNotificationContent(String userName, double amount, String dateStr) {
        String currentYear = new SimpleDateFormat("yyyy").format(new Date());

        return "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "    <title>Salary Payment Notification</title>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }" +
                "        .content { padding: 20px; background-color: #f9f9f9; }" +
                "        .payment-details { background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }" +
                "        .amount { font-size: 24px; font-weight: bold; color: #28a745; }" +
                "        .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #777; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h1>Salary Payment Notification</h1>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Dear " + userName + ",</p>" +
                "            <p>We are pleased to inform you that your salary has been processed.</p>" +
                "            <div class=\"payment-details\">" +
                "                <p><strong>Amount:</strong> <span class=\"amount\">$" + String.format("%.2f", amount) + "</span></p>" +
                "                <p><strong>Date:</strong> " + dateStr + "</p>" +
                "                <p><strong>Payment Method:</strong> Direct Deposit</p>" +
                "            </div>" +
                "            <p>This amount should be reflected in your bank account within the next 24-48 hours.</p>" +
                "            <p>If you have any questions regarding your payment, please contact the HR department.</p>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>&copy; " + currentYear + " Employee Management System. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send an email using the specified parameters.
     */
    private void sendEmail(String toEmail, String subject, String htmlContent) throws MessagingException {
        try {
            System.out.println("Configuring email message...");

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom(fromEmail);

            System.out.println("Sending email from: " + fromEmail + " to: " + toEmail);

            mailSender.send(mimeMessage);

            System.out.println("Email sent successfully to: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("Failed to send email: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Cause: " + e.getCause().getMessage());
                e.getCause().printStackTrace();
            }
            throw e;
        }
    }
}
