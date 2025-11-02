// Global variables
const correctPasscode = "402010";
let users = JSON.parse(localStorage.getItem('users')) || [];
let actionHistory = JSON.parse(localStorage.getItem('actionHistory')) || [];

// User Management Functions
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
}

function loadUsers() {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }
    const storedHistory = localStorage.getItem('actionHistory');
    if (storedHistory) {
        actionHistory = JSON.parse(storedHistory);
    }
}

function addToHistory(userName, action, timestamp = new Date()) {
    actionHistory.push({
        userName,
        action,
        timestamp
    });
    saveUsers();
    updateHistoryTable();
}

// Passcode System
function checkPasscode() {
    const enteredPasscode = document.getElementById("passcode").value;
    if (enteredPasscode === correctPasscode) {
        const userId = prompt("Enter your ID:");
        if (userId === "9999") {
            alert("Admin access granted. You can now manage users.");
            document.getElementById("adminHistoryContainer").style.display = "block";
            showUserManagement();
            addToHistory("Admin", "Logged in to admin panel");
            localStorage.setItem('currentUser', 'Admin');
        } else {
            const user = users.find(u => u.id === userId);
            if (user) {
                if (user.blocked) {
                    alert("Your account is blocked. Please contact the administrator.");
                    addToHistory(user.name, "Blocked user attempted admin access");
                } else {
                    alert("Welcome, " + user.name + "!");
                    showUserInterface(user);
                    addToHistory(user.name, "Logged in");
                }
            } else {
                alert("Invalid user ID.");
            }
        }
        document.getElementById("passcode").value = "";
    } else {
        alert("Incorrect passcode. Please try again.");
        document.getElementById("passcode").value = "";
    }
}

// UI Functions
function showUserManagement() {
    const container = document.getElementById("adminHistoryContainer");
    container.innerHTML = `
        <h2>User Management</h2>
        <div class="users-list">
            <h3>Active Users</h3>
            <div id="usersTable"></div>
        </div>
        <div class="history-table">
            <h3>Action History</h3>
            <table id="historyTable">
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Action</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody id="historyBody"></tbody>
            </table>
        </div>
    `;
    updateUsersList();
    updateHistoryTable();
}

function updateUsersList() {
    const table = document.getElementById("usersTable");
    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>User Name</th>
                    <th>User ID</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users
                    .filter(u => u.role === "user")
                    .map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.id}</td>
                            <td>
                                ${user.blocked ? " Blocked" : " Active"}
                                ${user.status === "pending" ? " (Pending)" : ""}
                            </td>
                            <td>
                                <button onclick="toggleBlock('${user.id}')">
                                    ${user.blocked ? "Unblock" : "Block"}
                                </button>
                            </td>
                        </tr>
                    `).join("")}
            </tbody>
        </table>
    `;
}

function showUserInterface(user) {
    const container = document.getElementById("protectedContent");
    container.innerHTML = `
        <div class="user-info">
            <h2>Welcome, ${user.name}!</h2>
            <p>User ID: ${user.id}</p>
            <p>Email: ${user.email}</p>
            <p>Registration Date: ${new Date(user.registrationDate).toLocaleDateString()}</p>
            <div class="user-actions">
                <button onclick="viewSchedule()">View Schedule</button>
                <button onclick="viewProfile()">View Profile</button>
                <button onclick="logout()">Logout</button>
            </div>
        </div>
    `;
}

function updateHistoryTable() {
    const body = document.getElementById("historyBody");
    body.innerHTML = actionHistory
        .map(entry => `
            <tr>
                <td>${entry.userName}</td>
                <td>${entry.action}</td>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
            </tr>
        `).join("");
}

// Initialize
window.addEventListener('load', () => {
    loadUsers();
    
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    const currentUserId = localStorage.getItem('currentUserId');
    
    if (currentUser && currentUserId) {
        if (currentUser === 'Admin') {
            document.getElementById("adminHistoryContainer").style.display = "block";
            showUserManagement();
        } else {
            const user = users.find(u => u.id === currentUserId);
            if (user && user.status === 'active' && !user.blocked) {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('register-container').style.display = 'none';
                document.getElementById('protectedContent').style.display = 'block';
                showUserInterface(user);
            } else {
                logout();
            }
        }
    } else {
        showLoginForm();
    }
});

// Form Toggle Functions
function showLoginForm() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('protectedContent').style.display = 'none';
    document.getElementById('adminHistoryContainer').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
    document.getElementById('protectedContent').style.display = 'none';
    document.getElementById('adminHistoryContainer').style.display = 'none';
}

// Keyboard Shortcuts
window.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        window.location.href = 'https://classroom.google.com/';
        addToHistory("System", "Opened Google Classroom");
    }
});

// Passcode Input Functions
function appendDigit(digit) {
    const passcode = document.getElementById("passcode");
    passcode.value += digit;
    checkPasscode();
}

function eraseDigit() {
    const passcode = document.getElementById("passcode");
    passcode.value = passcode.value.slice(0, -1);
}

function clearallDigits() {
    document.getElementById("passcode").value = "";
}

// Authentication Functions
async function register(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!username || !password || !confirmPassword || !email) {
        alert("Please fill in all fields.");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (users.some(u => u.name.toLowerCase() === username.toLowerCase())) {
        alert("Username already exists. Please choose another.");
        return false;
    }

    // Generate unique ID
    let userId;
    do {
        userId = Math.floor(Math.random() * 9000 + 1000).toString();
    } while (users.some(u => u.id === userId));

    const newUser = {
        name: username,
        id: userId,
        password: password,
        email: email,
        blocked: false,
        role: "user",
        registrationDate: new Date().toISOString(),
        status: "pending",
        registrationData: {
            username: username,
            email: email,
            registrationDate: new Date().toISOString(),
            lastAttempt: new Date().toISOString()
        }
    };

    try {
        users.push(newUser);
        saveUsers();
        addToHistory(newUser.name, "Registered new account (pending approval)");
        
        alert("Registration successful! Your account is pending approval.");
        showLoginForm();
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        alert('Error registering. Please try again.');
        return false;
    }
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return false;
    }

    const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    if (!user) {
        alert("User not found. Please register first.");
        return false;
    }

    if (user.password !== password) {
        alert("Incorrect password.");
        addToHistory(username, "Failed login attempt");
        return false;
    }

    if (user.blocked) {
        alert("Your account is currently blocked. Please contact an administrator.");
        addToHistory(username, "Blocked user attempted login");
        return false;
    }

    if (user.status !== 'active') {
        alert("Your account is pending approval. Please wait for an administrator to approve your account.");
        addToHistory(username, "Pending user attempted login");
        return false;
    }

    try {
        localStorage.setItem('currentUser', user.name);
        localStorage.setItem('currentUserId', user.id);
        addToHistory(user.name, "Successfully logged in");
        
        // Redirect to welcome page
        window.location.href = 'welcome.html';
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        alert('Error logging in. Please try again.');
        return false;
    }
}

// Admin Functions
function toggleBlock(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.blocked = !user.blocked;
        saveUsers();
        updateUsersList();
        addToHistory("Admin", `Toggled block status for ${user.name}`);
    }
}

// View Functions
function viewSchedule() {
    // Implement schedule viewing functionality
    alert("Schedule viewing is not yet implemented.");
}

function viewProfile() {
    // Implement profile viewing functionality
    alert("Profile viewing is not yet implemented.");
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    showLoginForm();
    document.getElementById('protectedContent').style.display = 'none';
    document.getElementById('adminHistoryContainer').style.display = 'none';
    addToHistory("System", "User logged out");
}