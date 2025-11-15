// role-selection.js - Handle user role selection and redirect

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Store user info
    const currentUser = {
        ...user,
        email: user.email,
        uid: user.uid
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
});

/**
 * Handle role selection
 * @param {string} role - The selected role ('student' or 'teacher')
 */
function selectRole(role) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Show loading spinner
    loadingSpinner.style.display = 'flex';
    loadingSpinner.style.flexDirection = 'column';
    loadingSpinner.style.justifyContent = 'center';
    loadingSpinner.style.alignItems = 'center';

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('Session expired. Please login again.');
        window.location.href = 'index.html';
        return;
    }

    // Add role to user object
    currentUser.role = role;
    currentUser.selectedAt = new Date().toISOString();

    // Generate student ID for students
    if (role === 'student') {
        const existingStudents = JSON.parse(localStorage.getItem('students')) || [];
        let existingStudent = existingStudents.find(s => s.email === currentUser.email);
        if (existingStudent) {
            currentUser.studentId = existingStudent.studentId;
        } else {
            const studentNumber = existingStudents.length + 1;
            currentUser.studentId = `STU${studentNumber.toString().padStart(4, '0')}`;
            existingStudents.push({ email: currentUser.email, studentId: currentUser.studentId });
            localStorage.setItem('students', JSON.stringify(existingStudents));
        }
    }

    // Save updated user info
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('userRole', role);

    // Create a log entry
    const roleSelectionLog = JSON.parse(localStorage.getItem('roleSelectionLog')) || [];
    roleSelectionLog.push({
        email: currentUser.email,
        role: role,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('roleSelectionLog', JSON.stringify(roleSelectionLog));

    // Redirect based on role
    setTimeout(() => {
        if (role === 'student') {
            window.location.href = 'home.html';
        } else if (role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        }
    }, 500);
}

/**
 * Logout and return to login page
 */
function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        // Clear relevant user data but keep basic Firebase user
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('tasks');
        localStorage.removeItem('studyGroups');
        localStorage.removeItem('classroom');
        localStorage.removeItem('assignments');
        localStorage.removeItem('teacherFeatures');
        localStorage.removeItem('studentAnalytics');

        window.location.href = 'index.html';
    }
}

// Add keyboard navigation support
document.addEventListener('keydown', function (e) {
    const cards = document.querySelectorAll('.role-card');
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const activeCard = document.activeElement;
        const cardIndex = Array.from(cards).indexOf(activeCard);
        
        if (cardIndex !== -1) {
            let nextIndex;
            if (e.key === 'ArrowRight') {
                nextIndex = (cardIndex + 1) % cards.length;
            } else {
                nextIndex = (cardIndex - 1 + cards.length) % cards.length;
            }
            cards[nextIndex].focus();
        }
    }
    
    if (e.key === 'Enter') {
        const activeCard = document.activeElement;
        if (activeCard.classList.contains('role-card')) {
            const role = activeCard.classList.contains('student-card') ? 'student' : 'teacher';
            selectRole(role);
        }
    }
});
