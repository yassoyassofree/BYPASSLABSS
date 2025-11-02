// ==================== AUTHENTICATION GUARD SYSTEM ====================
// This prevents direct access to any page without logging in first
// Updated to support 24-hour localStorage sessions from index.html
// Add this to EVERY HTML file in the <head> section

const authGuard = {
  // List of pages that DON'T need login
  publicPages: ['index.html', 'policy.html', 'secrect.html', ''],
  
  // Initialize guard on page load
  init() {
    this.checkAuthentication();
  },

  // Check if user is logged in
  checkAuthentication() {
    // Priority 1: Check for 24-hour localStorage session (from index.html)
    const loggedInUser = this.getLoggedInUser();
    const currentPageFile = this.getCurrentPageFile();

    console.log('🔐 Auth Guard Check:', { 
      user: loggedInUser, 
      page: currentPageFile, 
      isPublic: this.publicPages.includes(currentPageFile)
    });

    // Allow public pages
    if (this.publicPages.includes(currentPageFile)) {
      return true;
    }

    // If no username found, redirect to login
    if (!loggedInUser) {
      console.warn('⚠  Unauthorized access attempt to:', currentPageFile);
      this.logUnauthorizedAccess(currentPageFile);
      alert('❌ You must login first!\nRedirecting to login page...');
      window.location.href = 'index.html';
      return false;
    }

    // Verify session is valid
    if (!this.isSessionValid()) {
      console.warn('⚠  Session expired for:', loggedInUser);
      this.clearAllSessions();
      alert('⏱ Your session expired.\nPlease login again.');
      window.location.href = 'index.html';
      return false;
    }

    // Check if user is banned
    if (typeof policySystem !== 'undefined') {
      if (policySystem.isBanned(loggedInUser)) {
        const banInfo = policySystem.getBanInfo(loggedInUser);
        console.warn('🚫 Banned user attempted access:', loggedInUser);
        this.clearAllSessions();
        alert(banInfo.message);
        window.location.href = 'index.html';
        return false;
      }
    }

    // All checks passed
    console.log('✅ Authentication passed for:', loggedInUser);
    return true;
  },

  // Get logged in user (checks both localStorage and sessionStorage)
  getLoggedInUser() {
    // Priority 1: Check 24-hour localStorage session (from index.html)
    const localStorageUser = localStorage.getItem('currentUsername');
    const loginActive = localStorage.getItem('loginActive');
    
    if (localStorageUser && loginActive === 'true') {
      const expiryTime = localStorage.getItem('sessionExpiryTime');
      if (expiryTime) {
        const currentTime = new Date().getTime();
        if (currentTime < parseInt(expiryTime)) {
          console.log('✅ Found valid 24-hour session:', localStorageUser);
          return localStorageUser;
        } else {
          console.log('⏰ 24-hour session expired for:', localStorageUser);
        }
      }
    }

    // Priority 2: Fall back to sessionStorage (page session)
    const sessionStorageUser = sessionStorage.getItem('currentUsername');
    if (sessionStorageUser) {
      console.log('✅ Found sessionStorage user:', sessionStorageUser);
      return sessionStorageUser;
    }

    console.log('❌ No valid session found');
    return null;
  },

  // Get current page filename
  getCurrentPageFile() {
    const pathname = window.location.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || 'index.html';
  },

  // Check if session is still valid (24-hour localStorage OR sessionStorage)
  isSessionValid() {
    // Check localStorage 24-hour session
    const expiryTime = localStorage.getItem('sessionExpiryTime');
    if (expiryTime) {
      const currentTime = new Date().getTime();
      const isValid = currentTime < parseInt(expiryTime);
      if (isValid) {
        console.log('✅ 24-hour session still valid');
        return true;
      } else {
        console.log('⏰ 24-hour session expired');
      }
    }

    // Fall back to sessionStorage check
    const sessionTime = sessionStorage.getItem('sessionStartTime');
    if (!sessionTime) {
      console.log('❌ No session start time found');
      return false;
    }

    const maxSessionTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const currentTime = new Date().getTime();
    const sessionDuration = currentTime - parseInt(sessionTime);

    const isValid = sessionDuration < maxSessionTime;
    console.log('📊 Session duration check:', { 
      duration: Math.floor(sessionDuration / 1000 / 60) + ' minutes',
      maxTime: '24 hours',
      isValid
    });

    return isValid;
  },

  // Log unauthorized access attempts
  logUnauthorizedAccess(page) {
    const logs = JSON.parse(localStorage.getItem('unauthorizedAccessLogs') || '[]');
    logs.push({
      page: page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct'
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    localStorage.setItem('unauthorizedAccessLogs', JSON.stringify(logs));
  },

  // Get all unauthorized access logs (for admin)
  getUnauthorizedLogs() {
    return JSON.parse(localStorage.getItem('unauthorizedAccessLogs') || '[]');
  },

  // When user logs in successfully, call this
  setSessionValid(username, use24HourSession = true) {
    if (use24HourSession) {
      // Set 24-hour localStorage session
      const loginTime = new Date().getTime();
      const expiryTime = loginTime + (24 * 60 * 60 * 1000); // 24 hours
      
      localStorage.setItem('currentUsername', username);
      localStorage.setItem('sessionStartTime', loginTime.toString());
      localStorage.setItem('sessionExpiryTime', expiryTime.toString());
      localStorage.setItem('loginActive', 'true');
      
      console.log('✅ 24-hour session started for:', username);
    }

    // Also set sessionStorage backup
    sessionStorage.setItem('currentUsername', username);
    sessionStorage.setItem('sessionStartTime', new Date().getTime().toString());
    
    console.log('✅ Session initialized for:', username);
  },

  // When user logs out
  endSession() {
    const username = localStorage.getItem('currentUsername') || sessionStorage.getItem('currentUsername');
    console.log('🚪 Session ended for:', username);
    
    // Clear localStorage session
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('sessionExpiryTime');
    localStorage.removeItem('loginActive');
    
    // Clear sessionStorage
    sessionStorage.clear();
  },

  // Clear all session data
  clearAllSessions() {
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('sessionExpiryTime');
    localStorage.removeItem('loginActive');
    sessionStorage.clear();
    console.log('🧹 All sessions cleared');
  },

  // Get current session info (for debugging)
  getSessionInfo() {
    return {
      localStorageUser: localStorage.getItem('currentUsername'),
      loginActive: localStorage.getItem('loginActive'),
      sessionExpiryTime: localStorage.getItem('sessionExpiryTime'),
      sessionStorageUser: sessionStorage.getItem('currentUsername'),
      currentTime: new Date().getTime(),
      timeUntilExpiry: localStorage.getItem('sessionExpiryTime') ? 
        Math.floor((parseInt(localStorage.getItem('sessionExpiryTime')) - new Date().getTime()) / 1000 / 60) + ' minutes' : 
        'N/A'
    };
  }
};

// Run authentication check immediately when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authGuard.init());
} else {
  authGuard.init();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.authGuard = authGuard;
}

// Optional: Check session validity periodically (every 1 minute)
setInterval(() => {
  if (!authGuard.isSessionValid()) {
    console.warn('⚠️ Session validation check failed - redirecting to login');
    authGuard.clearAllSessions();
    window.location.href = 'index.html';
  }
}, 60000); // Check every minute