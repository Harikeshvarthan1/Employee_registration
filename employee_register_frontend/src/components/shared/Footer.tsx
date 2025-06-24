import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h5>About EMS</h5>
            <p>Employee Management System helps organizations efficiently manage workforce, attendance, salaries, and loan processes in one place.</p>
          </div>

          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li><Link className="footer-link" to="/dashboard">Dashboard</Link></li>
              <li><Link className="footer-link" to="/attendance">Attendance</Link></li>
              <li><Link className="footer-link" to="/salary">Salary</Link></li>
              <li><Link className="footer-link" to="/loan-repay">Loan Repayment</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Support</h5>
            <ul className="contact-info">
              <li><i className="bi bi-envelope"></i> support@ems-system.com</li>
              <li><i className="bi bi-telephone"></i> HR Helpdesk: (123) 456-7890</li>
              <li><i className="bi bi-question-circle"></i> <Link to="/faq">FAQ & Help Center</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Resources</h5>
            <ul className="footer-links">
              <li><a href="#" className="footer-link"><i className="bi bi-file-earmark-pdf"></i> Employee Handbook</a></li>
              <li><a href="#" className="footer-link"><i className="bi bi-file-earmark-text"></i> Leave Policy</a></li>
              <li><a href="#" className="footer-link"><i className="bi bi-file-earmark-ruled"></i> Loan Guidelines</a></li>
              <li><a href="#" className="footer-link"><i className="bi bi-shield-check"></i> Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright">
            <p>© {currentYear} Employee Management System. All rights reserved.</p>
          </div>
          <div className="footer-admin">
            <Link to="/admin" className="admin-link">Admin Portal</Link>
            <span className="version">v1.0.2</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
