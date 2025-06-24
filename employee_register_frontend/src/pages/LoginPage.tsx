import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '.././contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  // State variables
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [usernameFocused, setUsernameFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [showShakeAnimation, setShowShakeAnimation] = useState<boolean>(false);

  // Form values
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  
  // Form validation
  const [usernameTouched, setUsernameTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  
  // Auth context and navigation
  const auth = useAuth();
  const navigate = useNavigate();

  // Form reference
  const formRef = useRef<HTMLFormElement>(null);
  
  // Valid credentials (for authentication)
  const VALID_CREDENTIALS = {
    admin: {
      userName: 'admin',
      password: 'admin123'
    },
    user: {
      userName: 'user',
      password: 'user123'
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    console.log("Login component initialized, checking auth state");
    
    if (auth.isLoggedIn()) {
      console.log("User is already logged in, redirecting...");
      redirectBasedOnRole();
    }
  }, []);

  // Reset shake animation after it completes
  useEffect(() => {
    if (showShakeAnimation) {
      const timer = setTimeout(() => {
        setShowShakeAnimation(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showShakeAnimation]);

  // Validation functions
  const isUsernameValid = (username: string): boolean => {
    return username.length >= 3;
  };
  
  const getUsernameError = (): string | null => {
    if (!userName && usernameTouched) return 'Username is required';
    if (userName && !isUsernameValid(userName) && usernameTouched) return 'Username must be at least 3 characters';
    return null;
  };
  
  const getPasswordError = (): string | null => {
    if (!password && passwordTouched) return 'Password is required';
    if (password && password.length < 6 && passwordTouched) return 'Password must be at least 6 characters';
    return null;
  };
  
  const isFormValid = (): boolean => {
    return !!userName && isUsernameValid(userName) && !!password && password.length >= 6;
  };

  const switchTab = (tab: 'user' | 'admin') => {
    setActiveTab(tab);
    setErrorMessage('');
    setUserName('');
    setPassword('');
    setUsernameTouched(false);
    setPasswordTouched(false);
  };

  const togglePasswordVisibility = (event: React.MouseEvent) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const verifyCredentials = (enteredUsername: string, enteredPassword: string, role: 'user' | 'admin'): boolean => {
    const validCreds = VALID_CREDENTIALS[role];
    return enteredUsername === validCreds.userName && enteredPassword === validCreds.password;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Login form submitted");
    
    if (!isFormValid()) {
      console.log("Form is invalid");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Check if credentials match the valid ones for the selected role
    const isValidCredentials = verifyCredentials(userName, password, activeTab);
    
    if (!isValidCredentials) {
      // Handle invalid credentials
      setTimeout(() => {
        setIsLoading(false);
        setLoginAttempts(prev => prev + 1);
        setShowShakeAnimation(true);
        
        if (loginAttempts >= 2) {
          setErrorMessage(`Invalid credentials. Please use the example credentials shown below.`);
        } else {
          setErrorMessage(`Invalid username or password for ${activeTab} account.`);
        }
      }, 800);
      return;
    }
    
    try {
      console.log(`Attempting to login as ${activeTab}`);
      await auth.login({userName, password}, activeTab);
      
      // Add a small delay for better UX
      setTimeout(() => {
        setIsLoading(false);
        console.log("Login successful, redirecting...");
        redirectBasedOnRole();
      }, 800);
    } catch (error) {
      console.error("Login failed:", error);
      
      setTimeout(() => {
        setIsLoading(false);
        setShowShakeAnimation(true);
        setErrorMessage('Authentication service error. Please try again.');
      }, 800);
    }
  };

  const redirectBasedOnRole = () => {
    console.log("Redirecting based on role, isAdmin:", auth.isAdmin());
    if (auth.isAdmin()) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="animated-circle circle-1"></div>
        <div className="animated-circle circle-2"></div>
        <div className="animated-circle circle-3"></div>
      </div>

      <div className="login-container">
        {/* Split Design: Image and Form */}
        <div className="login-card">
          {/* Image Section */}
          <div className="hotel-image-section">
            <div className="content-overlay">
              <h2 className="welcome-text">Welcome to</h2>
              <div className="brand-logo">
                <span className="logo-text">EMS</span>
                <span className="logo-subtext">EMPLOYEE MANAGEMENT</span>
              </div>
              <p className="tagline">Workforce. Simplified.</p>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="login-form-section">
            <div className="form-header">
              <h3 className="form-title">Sign In</h3>
              
              {/* Login Type Toggle */}
              <div className="toggle-container">
                <div 
                  className={`toggle-option ${activeTab === 'user' ? 'active' : ''}`}
                  onClick={() => switchTab('user')}
                >
                  <i className="bi bi-person"></i>
                  <span>Employee</span>
                </div>
                <div 
                  className={`toggle-option ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => switchTab('admin')}
                >
                  <i className="bi bi-shield-lock"></i>
                  <span>Admin</span>
                </div>
                <div className={`toggle-slider ${activeTab === 'admin' ? 'slide-right' : ''}`}></div>
              </div>
            </div>

            {/* Alert for example credentials - without auto-filling */}
            <div className={`demo-credentials ${activeTab === 'admin' ? 'admin-mode' : 'user-mode'}`}>
              <div className="credentials-header">
                <i className={activeTab === 'admin' ? 'bi bi-shield-lock' : 'bi bi-person'}></i>
                <span>Required Credentials</span>
              </div>
              <div className="credentials-body">
                <div className="credential-item">
                  <span className="credential-label">Username:</span>
                  <span className="credential-value">
                    {activeTab === 'admin' ? VALID_CREDENTIALS.admin.userName : VALID_CREDENTIALS.user.userName}
                  </span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">Password:</span>
                  <span className="credential-value">
                    {activeTab === 'admin' ? VALID_CREDENTIALS.admin.password : VALID_CREDENTIALS.user.password}
                  </span>
                </div>
                <div className="credential-note">
                  <i className="bi bi-info-circle"></i> Only these specific credentials will work for this demo.
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="error-message fade-in-out">
                <i className="bi bi-exclamation-circle"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form 
              ref={formRef} 
              onSubmit={handleLogin} 
              className={`login-form ${showShakeAnimation ? 'shake-animation' : ''}`}
            >
              {/* Username Field */}
              <div className={`form-field ${usernameFocused ? 'focused' : ''} ${getUsernameError() ? 'has-error' : ''}`}>
                <label htmlFor="usernameInput" className="field-label">
                  <i className="field-icon bi bi-person"></i>
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  id="usernameInput"
                  name="username"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => {
                    setUsernameFocused(false);
                    setUsernameTouched(true);
                  }}
                  placeholder="Enter your username"
                />
                {getUsernameError() && (
                  <div className="field-error fade-in-out">
                    <span>{getUsernameError()}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className={`form-field ${passwordFocused ? 'focused' : ''} ${getPasswordError() ? 'has-error' : ''}`}>
                <label htmlFor="passwordInput" className="field-label">
                  <i className="field-icon bi bi-lock"></i>
                  <span>Password</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="passwordInput"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      setPasswordTouched(true);
                    }}
                    placeholder="Enter your password"
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={togglePasswordVisibility}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : ''}`}></i>
                  </button>
                </div>
                {getPasswordError() && (
                  <div className="field-error fade-in-out">
                    <span>{getPasswordError()}</span>
                  </div>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="form-options">
                <div className="remember-me">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      name="rememberMe" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkbox-checkmark"></span>
                    <span className="checkbox-label">Remember me</span>
                  </label>
                </div>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                className={`login-button ${activeTab === 'admin' ? 'admin-mode' : ''} ${isLoading ? 'loading' : ''}`}
                disabled={!isFormValid() || isLoading}
              >
                {!isLoading ? (
                  <span>
                    <i className={activeTab === 'admin' ? 'bi bi-shield-lock' : 'bi bi-box-arrow-in-right'}></i>
                    Sign in as {activeTab === 'admin' ? 'Administrator' : 'Employee'}
                  </span>
                ) : (
                  <div className="spinner">
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                  </div>
                )}
              </button>
            </form>

            {/* Additional Notes */}
            <div className="note-section">
              <div className="api-note">
                <i className="bi bi-info-circle"></i>
                <span>Demo uses specific credentials only. Other usernames will be rejected.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
