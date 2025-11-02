// ==================== POLICY ENFORCEMENT SYSTEM ====================
// This system automatically detects and enforces policy violations
// Works with the admin console for exceptions and management

const policySystem = {
  // Policy violation types
  violations: {
    LEAKED_INFO: { days: 7, name: 'Shared website info' },
    TEACHER_COMPLAINT: { days: 10, name: 'Reported to teacher' },
    ACCOUNT_THEFT: { days: 30, name: 'Account theft/unauthorized access' },
    DATA_COPYING: { days: 'PERMANENT', name: 'Data copying without attribution' },
    SHARING_CREDENTIALS: { days: 30, name: 'Shared login credentials' },
    ADMIN_IMPERSONATION: { days: 'PERMANENT', name: 'Impersonating admin/sharing admin access' },
    UNBLOCKING_ABUSE: { days: 'PERMANENT', name: 'Unblocking banned users without authorization' },
    REPEATED_VIOLATION: { days: 'PERMANENT', name: 'Repeated violations (3+ strikes)' }
  },

  // Track violations per user
  userViolations: new Map(),
  banExceptions: new Map(),
  violationLogs: [],

  // Initialize the system
  init() {
    console.log('✓ Policy Enforcement System initialized');
    this.loadViolationData();
    this.startMonitoring();
  },

  // Load violation data from storage
  loadViolationData() {
    try {
      const stored = localStorage.getItem('policyViolations');
      if (stored) {
        this.userViolations = new Map(JSON.parse(stored));
      }
      const logs = localStorage.getItem('violationLogs');
      if (logs) {
        this.violationLogs = JSON.parse(logs);
      }
    } catch (err) {
      console.warn('Error loading violation data:', err);
    }
  },

  // Save violation data to storage
  saveViolationData() {
    try {
      localStorage.setItem('policyViolations', JSON.stringify([...this.userViolations]));
      localStorage.setItem('violationLogs', JSON.stringify(this.violationLogs));
    } catch (err) {
      console.warn('Error saving violation data:', err);
    }
  },

  // Record a policy violation
  recordViolation(username, violationType, details = '') {
    if (!this.violations[violationType]) {
      console.error('Unknown violation type:', violationType);
      return false;
    }

    // Check if user has exception
    if (this.banExceptions.has(username)) {
      const exception = this.banExceptions.get(username);
      if (new Date() < exception.expiresAt) {
        console.log(`✓ ${username} has exception until ${exception.expiresAt}`);
        return false;
      } else {
        this.banExceptions.delete(username);
      }
    }

    // Get or create user violation record
    if (!this.userViolations.has(username)) {
      this.userViolations.set(username, {
        violations: [],
        banStatus: null,
        strikeCount: 0
      });
    }

    const userRecord = this.userViolations.get(username);
    const violation = {
      type: violationType,
      details: details,
      timestamp: new Date().toISOString(),
      banDays: this.violations[violationType].days
    };

    userRecord.violations.push(violation);
    userRecord.strikeCount++;

    // Log violation
    const logEntry = {
      username: username,
      violationType: violationType,
      details: details,
      timestamp: new Date().toISOString(),
      severity: this.violations[violationType].days
    };
    this.violationLogs.push(logEntry);

    // Determine ban action
    const banDecision = this.determineBanAction(username, userRecord);
    
    if (banDecision) {
      userRecord.banStatus = banDecision;
      this.saveBanToDatabase(username, banDecision);
      this.saveViolationData();
      return banDecision;
    }

    this.saveViolationData();
    return null;
  },

  // Determine if user should be banned
  determineBanAction(username, userRecord) {
    const strikeCount = userRecord.strikeCount;

    // Check for permanent ban triggers
    if (strikeCount >= 3) {
      return {
        permanent: true,
        reason: 'REPEATED_VIOLATION',
        message: '❌ PERMANENT BAN - Multiple policy violations'
      };
    }

    // Check for specific permanent violations
    const lastViolation = userRecord.violations[userRecord.violations.length - 1];
    if (this.violations[lastViolation.type].days === 'PERMANENT') {
      return {
        permanent: true,
        reason: lastViolation.type,
        message: `❌ PERMANENT BAN - ${this.violations[lastViolation.type].name}`
      };
    }

    // Temporary ban
    const banDays = this.violations[lastViolation.type].days;
    const unbanDate = new Date();
    unbanDate.setDate(unbanDate.getDate() + banDays);

    return {
      permanent: false,
      days: banDays,
      unbanDate: unbanDate.toISOString(),
      reason: lastViolation.type,
      message: `⏱ TEMPORARY BAN - ${banDays} days (${this.violations[lastViolation.type].name})`
    };
  },

  // Check if user is currently banned
  isBanned(username) {
    if (!this.userViolations.has(username)) {
      return false;
    }

    const userRecord = this.userViolations.get(username);
    if (!userRecord.banStatus) {
      return false;
    }

    if (userRecord.banStatus.permanent) {
      return true;
    }

    // Check if temp ban has expired
    const unbanDate = new Date(userRecord.banStatus.unbanDate);
    if (new Date() < unbanDate) {
      return true;
    }

    // Ban expired, remove it
    userRecord.banStatus = null;
    this.saveViolationData();
    return false;
  },

  // Get ban information for a user
  getBanInfo(username) {
    if (!this.isBanned(username)) {
      return null;
    }

    const userRecord = this.userViolations.get(username);
    return userRecord.banStatus;
  },

  // Admin function: Add exception for a user
  addException(username, daysValid, addedBy) {
    if (daysValid <= 0) {
      return { success: false, message: 'Days must be greater than 0' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    this.banExceptions.set(username, {
      addedBy: addedBy,
      daysValid: daysValid,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });

    this.saveViolationData();
    return { 
      success: true, 
      message: `✓ Exception added for ${username} until ${expiresAt.toLocaleDateString()}` 
    };
  },

  // Admin function: Remove exception
  removeException(username) {
    if (this.banExceptions.has(username)) {
      this.banExceptions.delete(username);
      this.saveViolationData();
      return { success: true, message: `✓ Exception removed for ${username}` };
    }
    return { success: false, message: 'No exception found for this user' };
  },

  // Admin function: Get user violation history
  getUserViolationHistory(username) {
    if (!this.userViolations.has(username)) {
      return null;
    }

    const userRecord = this.userViolations.get(username);
    return {
      username: username,
      strikeCount: userRecord.strikeCount,
      banStatus: userRecord.banStatus,
      violations: userRecord.violations,
      exception: this.banExceptions.get(username) || null
    };
  },

  // Admin function: Clear violations for a user
  clearViolations(username, clearedBy) {
    if (this.userViolations.has(username)) {
      const record = this.userViolations.get(username);
      record.violations = [];
      record.strikeCount = 0;
      record.banStatus = null;
      
      this.violationLogs.push({
        action: 'VIOLATIONS_CLEARED',
        username: username,
        clearedBy: clearedBy,
        timestamp: new Date().toISOString()
      });

      this.saveViolationData();
      return { success: true, message: `✓ Violations cleared for ${username}` };
    }
    return { success: false, message: 'User has no violations' };
  },

  // Get all violations log for admin review
  getViolationLogs(limit = 50) {
    return this.violationLogs.slice(-limit).reverse();
  },

  // Start monitoring system
  startMonitoring() {
    // Monitor for multiple login attempts from different devices
    this.monitorLoginAttempts();
    
    // Check for expired bans periodically
    setInterval(() => {
      this.checkExpiredBans();
    }, 60000); // Check every minute
  },

  // Monitor suspicious login patterns
  monitorLoginAttempts() {
    const loginKey = 'loginAttempts';
    window.recordLogin = (username) => {
      const attempts = JSON.parse(sessionStorage.getItem(loginKey) || '{}');
      
      if (!attempts[username]) {
        attempts[username] = [];
      }

      attempts[username].push({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      // Check for suspicious patterns (multiple attempts in short time)
      const recentAttempts = attempts[username].filter(a => {
        const time = new Date(a.timestamp);
        return new Date() - time < 300000; // 5 minutes
      });

      if (recentAttempts.length > 3) {
        this.recordViolation(username, 'ACCOUNT_THEFT', 'Multiple login attempts detected');
      }

      sessionStorage.setItem(loginKey, JSON.stringify(attempts));
    };
  },

  // Check for expired temporary bans
  checkExpiredBans() {
    this.userViolations.forEach((record, username) => {
      if (record.banStatus && !record.banStatus.permanent) {
        const unbanDate = new Date(record.banStatus.unbanDate);
        if (new Date() >= unbanDate) {
          record.banStatus = null;
          console.log(`✓ Ban expired for ${username}`);
        }
      }
    });
    this.saveViolationData();
  },

  // Save ban to Firebase if available
  saveBanToDatabase(username, banDecision) {
    if (typeof db !== 'undefined' && db) {
      try {
        db.collection('bans').doc(username).set({
          banStatus: banDecision,
          recordedAt: new Date().toISOString()
        });
        console.log('✓ Ban recorded in Firebase');
      } catch (err) {
        console.warn('Could not save to Firebase:', err);
      }
    }
  }
};

// Initialize the system
policySystem.init();

// Export for admin console use
if (typeof window !== 'undefined') {
  window.policySystem = policySystem;
}