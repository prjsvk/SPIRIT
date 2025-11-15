// teacher-dashboard.js - Teacher Dashboard Functionality

let currentTeacher = null;
let classrooms = [];
let assignments = [];
let resources = [];
let token = null;

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    loadTeacherData();
    updateStats();
});

/**
 * Initialize the teacher dashboard
 */
function initializeDashboard() {
    // Check if user is logged in and is a teacher
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    token = localStorage.getItem('token');

    if (!storedUser || storedUser.role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }

    currentTeacher = storedUser;

    // Display teacher name
    const name = currentTeacher.displayName || currentTeacher.email.split('@')[0];
    document.getElementById('teacherName').textContent = name;

    // Set email in settings
    document.getElementById('settingsEmail').value = currentTeacher.email;
    document.getElementById('settingsName').value = name;
}

/**
 * Load teacher data from localStorage
 */
function loadTeacherData() {
    classrooms = JSON.parse(localStorage.getItem('classrooms')) || [];
    assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    resources = JSON.parse(localStorage.getItem('resources')) || [];

    renderClassrooms();
    renderAssignments();
    renderResources();
    renderStudentAnalytics();
    updateClassroomDropdown();
}

/**
 * Load classrooms from API
 */
async function loadClassrooms() {
    const response = await fetch(`${API_BASE}/classrooms`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        classrooms = await response.json();
    } else {
        throw new Error('Failed to load classrooms');
    }
}

/**
 * Load assignments from API
 */
async function loadAssignments() {
    const response = await fetch(`${API_BASE}/tasks/teacher`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        assignments = await response.json();
    } else {
        throw new Error('Failed to load assignments');
    }
}

/**
 * Render classrooms
 */
function renderClassrooms() {
    const classroomList = document.getElementById('classroomList');

    if (classrooms.length === 0) {
        classroomList.innerHTML = `
            <div class="empty-state">
                <i class="ri-building-2-line"></i>
                <p>No classrooms yet. Create your first classroom!</p>
            </div>
        `;
        return;
    }

    classroomList.innerHTML = classrooms.map(classroom => `
        <div class="classroom-card">
            <h3>${classroom.name}</h3>
            <p>${classroom.description || 'No description'}</p>
            <div class="classroom-meta">
                <span><i class="ri-group-line"></i> ${classroom.students.length} Students</span>
                <span><i class="ri-time-line"></i> ${classroom.schedule || 'No schedule'}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-small btn-primary" onclick="viewClassroom('${classroom._id}')">
                    <i class="ri-eye-line"></i> View
                </button>
                <button class="btn btn-small btn-secondary" onclick="deleteClassroom('${classroom._id}')">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Render assignments
 */
function renderAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');

    if (assignments.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-line"></i>
                <p>No assignments yet. Create one to get started!</p>
            </div>
        `;
        return;
    }

    assignmentsList.innerHTML = assignments.map(assignment => `
        <div class="assignment-card">
            <div class="assignment-info">
                <h3>${assignment.title}</h3>
                <p><strong>Classroom:</strong> ${assignment.classroom.name} | <strong>Type:</strong> ${assignment.type} | <strong>Due:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Points:</strong> ${assignment.points} | <strong>Assigned to:</strong> ${assignment.assignedStudents.length} students</p>
            </div>
            <div class="assignment-actions">
                <button class="btn btn-small btn-primary" onclick="viewAssignment('${assignment._id}')">
                    <i class="ri-eye-line"></i> View
                </button>
                <button class="btn btn-small btn-secondary" onclick="deleteAssignment('${assignment._id}')">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Render resources
 */
function renderResources() {
    const resourcesList = document.getElementById('resourcesList');

    if (resources.length === 0) {
        resourcesList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="ri-book-open-line"></i>
                <p>No resources uploaded yet.</p>
            </div>
        `;
        return;
    }

    resourcesList.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <i class="ri-${getResourceIcon(resource.type)}"></i>
            <h4>${resource.title}</h4>
            <p>${resource.type}</p>
            <button class="btn btn-small btn-secondary" onclick="deleteResource('${resource.id}')" style="width: 100%; margin-top: 1rem;">
                <i class="ri-delete-bin-line"></i> Delete
            </button>
        </div>
    `).join('');
}

/**
 * Get icon for resource type
 */
function getResourceIcon(type) {
    const icons = {
        pdf: 'file-pdf-line',
        video: 'video-line',
        document: 'file-text-line',
        presentation: 'presentation-line',
        worksheet: 'file-list-line'
    };
    return icons[type] || 'file-line';
}

/**
 * Update classroom dropdown
 */
function updateClassroomDropdown() {
    const select = document.getElementById('assignmentClassroom');
    select.innerHTML = '<option value="">Choose a classroom...</option>' +
        classrooms.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

/**
 * Open classroom modal
 */
function openClassroomModal() {
    document.getElementById('classroomModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open assignment modal
 */
function openAssignmentModal() {
    document.getElementById('assignmentModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open resource modal
 */
function openResourceModal() {
    document.getElementById('resourceModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open settings modal
 */
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Close modal
 */
function closeModal(modalId) {
    document.getElementById('modalBackdrop').classList.remove('active');
    document.getElementById(modalId).classList.remove('active');
}

/**
 * Save classroom
 */
async function saveClassroom() {
    const name = document.getElementById('classroomName').value.trim();
    const students = document.getElementById('classroomStudents').value.trim();
    const schedule = document.getElementById('classroomSchedule').value.trim();
    const description = document.getElementById('classroomDescription').value.trim();

    if (!name) {
        showToast('Please enter a classroom name', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classrooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                description,
                schedule
            })
        });

        if (response.ok) {
            const newClassroom = await response.json();
            classrooms.push(newClassroom);

            // Clear form
            document.getElementById('classroomName').value = '';
            document.getElementById('classroomStudents').value = '';
            document.getElementById('classroomSchedule').value = '';
            document.getElementById('classroomDescription').value = '';

            closeModal('classroomModal');
            renderClassrooms();
            updateStats();
            updateClassroomDropdown();
            showToast('✅ Classroom created successfully!');
        } else {
            const error = await response.json();
            showToast(error.message || 'Error creating classroom', 'error');
        }
    } catch (error) {
        showToast('Error creating classroom', 'error');
    }
}

/**
 * Save assignment
 */
async function saveAssignment() {
    const title = document.getElementById('assignmentTitle').value.trim();
    const classroomId = document.getElementById('assignmentClassroom').value;
    const description = document.getElementById('assignmentDescription').value.trim();
    const dueDate = document.getElementById('assignmentDueDate').value;
    const type = document.getElementById('assignmentType').value;
    const points = document.getElementById('assignmentPoints').value.trim();

    if (!title || !classroomId || !dueDate || !type) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                type,
                classroomId,
                dueDate,
                points: parseInt(points) || 100
            })
        });

        if (response.ok) {
            const newAssignment = await response.json();
            assignments.push(newAssignment);

            // Clear form
            document.getElementById('assignmentTitle').value = '';
            document.getElementById('assignmentClassroom').value = '';
            document.getElementById('assignmentDescription').value = '';
            document.getElementById('assignmentDueDate').value = '';
            document.getElementById('assignmentType').value = '';
            document.getElementById('assignmentPoints').value = '100';

            closeModal('assignmentModal');
            renderAssignments();
            updateStats();
            showToast('✅ Assignment created successfully!');
        } else {
            const error = await response.json();
            showToast(error.message || 'Error creating assignment', 'error');
        }
    } catch (error) {
        showToast('Error creating assignment', 'error');
    }
}

/**
 * Save resource
 */
function saveResource() {
    const title = document.getElementById('resourceTitle').value.trim();
    const type = document.getElementById('resourceType').value;
    const file = document.getElementById('resourceFile').files[0];

    if (!title || !type || !file) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const resource = {
        id: Date.now().toString(),
        title,
        type,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        teacher: currentTeacher.email
    };

    resources.push(resource);
    localStorage.setItem('resources', JSON.stringify(resources));

    // Clear form
    document.getElementById('resourceTitle').value = '';
    document.getElementById('resourceType').value = '';
    document.getElementById('resourceFile').value = '';

    closeModal('resourceModal');
    renderResources();
    showToast('✅ Resource uploaded successfully!');
}

/**
 * Save settings
 */
function saveSettings() {
    const name = document.getElementById('settingsName').value.trim();

    if (!name) {
        showToast('Please enter your name', 'error');
        return;
    }

    currentTeacher.displayName = name;
    localStorage.setItem('currentUser', JSON.stringify(currentTeacher));

    closeModal('settingsModal');
    document.getElementById('teacherName').textContent = name;
    showToast('✅ Settings saved successfully!');
}

/**
 * Delete classroom
 */
async function deleteClassroom(classroomId) {
    if (confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE}/classrooms/${classroomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                classrooms = classrooms.filter(c => c._id !== classroomId);
                renderClassrooms();
                updateStats();
                updateClassroomDropdown();
                showToast('🗑️ Classroom deleted');
            } else {
                const error = await response.json();
                showToast(error.message || 'Error deleting classroom', 'error');
            }
        } catch (error) {
            showToast('Error deleting classroom', 'error');
        }
    }
}

/**
 * Delete assignment
 */
async function deleteAssignment(assignmentId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        try {
            const response = await fetch(`${API_BASE}/tasks/${assignmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                assignments = assignments.filter(a => a._id !== assignmentId);
                renderAssignments();
                updateStats();
                showToast('🗑️ Assignment deleted');
            } else {
                const error = await response.json();
                showToast(error.message || 'Error deleting assignment', 'error');
            }
        } catch (error) {
            showToast('Error deleting assignment', 'error');
        }
    }
}

/**
 * Delete resource
 */
function deleteResource(resourceId) {
    if (confirm('Are you sure you want to delete this resource?')) {
        resources = resources.filter(r => r.id !== resourceId);
        localStorage.setItem('resources', JSON.stringify(resources));
        renderResources();
        showToast('🗑️ Resource deleted');
    }
}

/**
 * View classroom
 */
function viewClassroom(classroomId) {
    const classroom = classrooms.find(c => c.id === classroomId || c._id === classroomId);
    if (!classroom) {
        showToast('Classroom not found', 'error');
        return;
    }

    // Update modal title and info
    document.getElementById('classroomDetailsTitle').textContent = classroom.name;
    document.getElementById('classroomInfo').innerHTML = `
        <strong>Description:</strong> ${classroom.description || 'No description'}<br>
        <strong>Schedule:</strong> ${classroom.schedule || 'No schedule'}<br>
        <strong>Students:</strong> ${classroom.students ? classroom.students.length : 0}
    `;

    // Store current classroom ID for adding students
    window.currentClassroomId = classroom.id || classroom._id;

    // Clear quick add input
    document.getElementById('quickStudentId').value = '';

    // Render students
    renderClassroomStudents(classroom.students || []);

    // Open modal
    document.getElementById('classroomDetailsModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Render classroom students
 */
function renderClassroomStudents(students) {
    const studentsList = document.getElementById('classroomStudentsList');

    if (!students || students.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-group-line"></i>
                <p>No students in this classroom yet.</p>
            </div>
        `;
        return;
    }

    studentsList.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="student-info">
                <h4>${student.displayName || student.email.split('@')[0]}</h4>
                <p>${student.email} | ID: ${student.studentId}</p>
            </div>
            <div class="student-actions">
                <button class="btn btn-small btn-danger" onclick="removeStudentFromClassroom('${student.id || student.studentId}')">
                    <i class="ri-user-unfollow-line"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Open add student modal
 */
function openAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Add student to classroom
 */
function addStudentToClassroom() {
    const studentId = document.getElementById('studentIdInput').value.trim();
    if (!studentId) {
        showToast('Please enter a student ID', 'error');
        return;
    }

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.studentId === studentId);
    if (!student) {
        showToast('Student not found', 'error');
        return;
    }

    const classroom = classrooms.find(c => c.id === window.currentClassroomId || c._id === window.currentClassroomId);
    if (!classroom) {
        showToast('Classroom not found', 'error');
        return;
    }

    // Check if already added
    if (classroom.students.some(s => s.studentId === studentId)) {
        showToast('Student already in classroom', 'error');
        return;
    }

    classroom.students.push({
        id: studentId,
        displayName: student.email.split('@')[0], // Simple name
        email: student.email,
        studentId: student.studentId
    });

    localStorage.setItem('classrooms', JSON.stringify(classrooms));

    // Re-render
    renderClassroomStudents(classroom.students);
    updateStats();

    // Clear form and close modal
    document.getElementById('studentIdInput').value = '';
    closeModal('addStudentModal');

    showToast('✅ Student added to classroom!');
}

/**
 * Quick add student to classroom
 */
function quickAddStudent() {
    const studentId = document.getElementById('quickStudentId').value.trim();
    if (!studentId) {
        showToast('Please enter a student ID', 'error');
        return;
    }

    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.studentId === studentId);
    if (!student) {
        showToast('Student not found', 'error');
        return;
    }

    const classroom = classrooms.find(c => c.id === window.currentClassroomId || c._id === window.currentClassroomId);
    if (!classroom) {
        showToast('Classroom not found', 'error');
        return;
    }

    // Check if already added
    if (classroom.students.some(s => s.studentId === studentId)) {
        showToast('Student already in classroom', 'error');
        return;
    }

    classroom.students.push({
        id: studentId,
        displayName: student.email.split('@')[0], // Simple name
        email: student.email,
        studentId: student.studentId
    });

    localStorage.setItem('classrooms', JSON.stringify(classrooms));

    // Re-render
    renderClassroomStudents(classroom.students);
    updateStats();

    // Clear input
    document.getElementById('quickStudentId').value = '';

    showToast('✅ Student added to classroom!');
}

/**
 * Remove student from classroom
 */
function removeStudentFromClassroom(studentId) {
    if (!confirm('Are you sure you want to remove this student from the classroom?')) {
        return;
    }

    const classroom = classrooms.find(c => c.id === window.currentClassroomId || c._id === window.currentClassroomId);
    if (!classroom) return;

    classroom.students = classroom.students.filter(s => s.id !== studentId);
    localStorage.setItem('classrooms', JSON.stringify(classrooms));

    // Re-render
    renderClassroomStudents(classroom.students);
    updateStats();

    showToast('🗑️ Student removed from classroom');
}

/**
 * Load classroom students for assignment
 */
function loadClassroomStudents() {
    const classroomId = document.getElementById('assignmentClassroom').value;
    const studentSelection = document.getElementById('studentSelection');

    if (!classroomId) {
        studentSelection.innerHTML = '<p class="text-muted">Select a classroom first</p>';
        return;
    }

    const classroom = classrooms.find(c => c.id === classroomId || c._id === classroomId);
    if (!classroom || !classroom.students || classroom.students.length === 0) {
        studentSelection.innerHTML = '<p class="text-muted">No students in this classroom</p>';
        return;
    }

    studentSelection.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
            <label style="font-weight: bold;">Select students to assign:</label>
        </div>
        ${classroom.students.map(student => `
            <div class="student-checkbox">
                <input type="checkbox" id="student-${student.id}" value="${student.id}">
                <label for="student-${student.id}">${student.displayName} (${student.studentId})</label>
            </div>
        `).join('')}
        <div style="margin-top: 0.5rem;">
            <button type="button" class="btn btn-small btn-secondary" onclick="selectAllStudents()">Select All</button>
            <button type="button" class="btn btn-small btn-secondary" onclick="deselectAllStudents()">Deselect All</button>
        </div>
    `;
}

/**
 * Select all students
 */
function selectAllStudents() {
    const checkboxes = document.querySelectorAll('#studentSelection input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

/**
 * Deselect all students
 */
function deselectAllStudents() {
    const checkboxes = document.querySelectorAll('#studentSelection input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

/**
 * View assignment
 */
function viewAssignment(assignmentId) {
    // TODO: Implement assignment details view with student assignment
    showToast('Opening assignment details...');
}

/**
 * Export analytics
 */
function exportAnalytics() {
    showToast('📥 Exporting analytics report...');
}

/**
 * Render student analytics
 */
function renderStudentAnalytics() {
    const analyticsContainer = document.querySelector('.analytics-container');
    
    // Get all students across all classrooms
    const allStudents = new Map();
    classrooms.forEach(classroom => {
        classroom.students.forEach(student => {
            if (!allStudents.has(student.studentId)) {
                allStudents.set(student.studentId, {
                    ...student,
                    assignments: []
                });
            }
        });
    });

    // Calculate analytics for each student
    assignments.forEach(assignment => {
        assignment.assignedStudents.forEach(student => {
            if (allStudents.has(student.studentId)) {
                const studentData = allStudents.get(student.studentId);
                const isCompleted = assignment.completedBy && assignment.completedBy.some(completion => {
                    if (typeof completion === 'string') {
                        // Legacy format: just email string
                        return completion === student.email || completion === student.studentId;
                    } else if (completion.email) {
                        // New format: object with email property
                        return completion.email === student.email || completion.email === student.studentId;
                    }
                    return false;
                });
                
                studentData.assignments.push({
                    id: assignment.id,
                    title: assignment.title,
                    points: assignment.points,
                    earned: isCompleted ? assignment.points : 0,
                    completed: isCompleted,
                    dueDate: assignment.dueDate,
                    type: assignment.type
                });
            }
        });
    });

    // Calculate totals and averages
    const studentAnalytics = Array.from(allStudents.values()).map(student => {
        const totalPossible = student.assignments.reduce((sum, a) => sum + a.points, 0);
        const totalEarned = student.assignments.reduce((sum, a) => sum + a.earned, 0);
        const completedCount = student.assignments.filter(a => a.completed).length;
        const average = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0;
        
        return {
            ...student,
            totalPossible,
            totalEarned,
            completedCount,
            totalAssignments: student.assignments.length,
            average: parseFloat(average)
        };
    }).sort((a, b) => b.average - a.average); // Sort by average descending

    if (studentAnalytics.length === 0) {
        analyticsContainer.innerHTML = `
            <div class="chart-placeholder">
                <i class="ri-bar-chart-line"></i>
                <p>No student data available yet. Create classrooms and assignments to see analytics!</p>
            </div>
        `;
        return;
    }

    // Create analytics HTML
    let analyticsHTML = `
        <div class="analytics-summary">
            <div class="summary-card">
                <h3>Class Overview</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-number">${studentAnalytics.length}</span>
                        <span class="stat-label">Total Students</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${assignments.length}</span>
                        <span class="stat-label">Assignments</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${studentAnalytics.reduce((sum, s) => sum + s.completedCount, 0)}</span>
                        <span class="stat-label">Completions</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${studentAnalytics.length > 0 ? (studentAnalytics.reduce((sum, s) => sum + s.average, 0) / studentAnalytics.length).toFixed(1) : 0}%</span>
                        <span class="stat-label">Class Average</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="student-analytics-table">
            <h3>Individual Student Performance</h3>
            <div class="table-responsive">
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>ID</th>
                            <th>Assignments Completed</th>
                            <th>Points Earned</th>
                            <th>Total Points</th>
                            <th>Average</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    studentAnalytics.forEach(student => {
        const performanceClass = student.average >= 90 ? 'excellent' : 
                                student.average >= 80 ? 'good' : 
                                student.average >= 70 ? 'average' : 'needs-improvement';
        
        analyticsHTML += `
            <tr>
                <td>${student.displayName}</td>
                <td>${student.studentId}</td>
                <td>${student.completedCount}/${student.totalAssignments}</td>
                <td>${student.totalEarned}</td>
                <td>${student.totalPossible}</td>
                <td>${student.average}%</td>
                <td><span class="performance-badge ${performanceClass}">${getPerformanceLabel(student.average)}</span></td>
            </tr>
        `;
    });

    analyticsHTML += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="assignment-breakdown">
            <h3>Assignment Breakdown</h3>
            <div class="assignment-stats">
    `;

    assignments.forEach(assignment => {
        const completed = assignment.completedBy ? assignment.completedBy.length : 0;
        const assigned = assignment.assignedStudents ? assignment.assignedStudents.length : 0;
        const completionRate = assigned > 0 ? ((completed / assigned) * 100).toFixed(1) : 0;
        
        analyticsHTML += `
            <div class="assignment-stat-card">
                <h4>${assignment.title}</h4>
                <div class="assignment-meta">
                    <span>Type: ${assignment.type}</span>
                    <span>Points: ${assignment.points}</span>
                </div>
                <div class="completion-bar">
                    <div class="completion-fill" style="width: ${completionRate}%"></div>
                </div>
                <div class="completion-text">
                    ${completed}/${assigned} students (${completionRate}%)
                </div>
            </div>
        `;
    });

    analyticsHTML += `
            </div>
        </div>
    `;

    analyticsContainer.innerHTML = analyticsHTML;
}

/**
 * Get performance label based on average
 */
function getPerformanceLabel(average) {
    if (average >= 90) return 'Excellent';
    if (average >= 80) return 'Good';
    if (average >= 70) return 'Average';
    return 'Needs Improvement';
}

/**
 * Open help
 */
function openHelp() {
    alert('Help & Support\n\nFor assistance, please visit our documentation or contact support@spirit.com');
}

/**
 * Switch role
 */
function switchRole() {
    if (confirm('Are you sure you want to switch to student mode?')) {
        localStorage.removeItem('userRole');
        window.location.href = 'role-selection.html';
    }
}

/**
 * Logout
 */
function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('classrooms');
        localStorage.removeItem('assignments');
        localStorage.removeItem('resources');
        window.location.href = 'index.html';
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle theme
 */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('teacherTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme preference
window.addEventListener('load', function () {
    const savedTheme = localStorage.getItem('teacherTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
});

// Close modal when clicking on backdrop
document.addEventListener('click', function (e) {
    if (e.target.id === 'modalBackdrop') {
        document.getElementById('modalBackdrop').classList.remove('active');
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

/**
 * Load teacher data from localStorage
 */
function loadTeacherData() {
    classrooms = JSON.parse(localStorage.getItem('classrooms')) || [];
    assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    resources = JSON.parse(localStorage.getItem('resources')) || [];

    // Ensure classrooms have id
    classrooms.forEach(classroom => {
        if (!classroom.id && !classroom._id) {
            classroom.id = Date.now().toString() + Math.random().toString();
        }
    });

    // Ensure assignments have id
    assignments.forEach(assignment => {
        if (!assignment.id && !assignment._id) {
            assignment.id = Date.now().toString() + Math.random().toString();
        }
    });

    renderClassrooms();
    renderAssignments();
    renderResources();
    updateClassroomDropdown();
}

/**
 * Render classrooms
 */
function renderClassrooms() {
    const classroomList = document.getElementById('classroomList');

    if (classrooms.length === 0) {
        classroomList.innerHTML = `
            <div class="empty-state">
                <i class="ri-building-2-line"></i>
                <p>No classrooms yet. Create your first classroom!</p>
            </div>
        `;
        return;
    }

    classroomList.innerHTML = classrooms.map(classroom => `
        <div class="classroom-card">
            <h3>${classroom.name}</h3>
            <p>${classroom.description || 'No description'}</p>
            <div class="classroom-meta">
                <span><i class="ri-group-line"></i> ${classroom.students ? classroom.students.length : 0} Students</span>
                <span><i class="ri-time-line"></i> ${classroom.schedule || 'No schedule'}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-small btn-primary" onclick="viewClassroom('${classroom.id || classroom._id}')">
                    <i class="ri-eye-line"></i> View
                </button>
                <button class="btn btn-small btn-secondary" onclick="deleteClassroom('${classroom.id || classroom._id}')">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Render assignments
 */
function renderAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');

    if (assignments.length === 0) {
        assignmentsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-line"></i>
                <p>No assignments yet. Create one to get started!</p>
            </div>
        `;
        return;
    }

    assignmentsList.innerHTML = assignments.map(assignment => {
        const completedCount = assignment.completedBy ? assignment.completedBy.length : 0;
        const assignedCount = assignment.assignedStudents ? assignment.assignedStudents.length : 0;
        const isFinished = assignment.finished;
        return `
        <div class="assignment-card">
            <div class="assignment-info">
                <h3>${assignment.title} ${isFinished ? '<span style="color: green; font-size: 0.8em;">(Finished)</span>' : ''}</h3>
                <p><strong>Type:</strong> ${assignment.type} | <strong>Due:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Points:</strong> ${assignment.points} | <strong>Completed:</strong> ${completedCount}/${assignedCount}</p>
            </div>
            <div class="assignment-actions">
                <button class="btn btn-small btn-primary" onclick="viewAssignment('${assignment.id || assignment._id}')">
                    <i class="ri-eye-line"></i> View
                </button>
                ${!isFinished ? `<button class="btn btn-small btn-success" onclick="markAssignmentFinished('${assignment.id || assignment._id}')">
                    <i class="ri-check-line"></i> Finish
                </button>` : ''}
                <button class="btn btn-small btn-secondary" onclick="deleteAssignment('${assignment.id || assignment._id}')">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </div>
        </div>
    `}).join('');
}

/**
 * Render resources
 */
function renderResources() {
    const resourcesList = document.getElementById('resourcesList');

    if (resources.length === 0) {
        resourcesList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="ri-book-open-line"></i>
                <p>No resources uploaded yet.</p>
            </div>
        `;
        return;
    }

    resourcesList.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <i class="ri-${getResourceIcon(resource.type)}"></i>
            <h4>${resource.title}</h4>
            <p>${resource.type}</p>
            <button class="btn btn-small btn-secondary" onclick="deleteResource('${resource.id}')" style="width: 100%; margin-top: 1rem;">
                <i class="ri-delete-bin-line"></i> Delete
            </button>
        </div>
    `).join('');
}

/**
 * Get icon for resource type
 */
function getResourceIcon(type) {
    const icons = {
        pdf: 'file-pdf-line',
        video: 'video-line',
        document: 'file-text-line',
        presentation: 'presentation-line',
        worksheet: 'file-list-line'
    };
    return icons[type] || 'file-line';
}

/**
 * Update statistics
 */
function updateStats() {
    let totalStudents = 0;
    classrooms.forEach(classroom => {
        totalStudents += classroom.students.length;
    });

    // Count today's submissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todaysSubmissions = 0;
    assignments.forEach(assignment => {
        if (assignment.completedBy && Array.isArray(assignment.completedBy)) {
            assignment.completedBy.forEach(completion => {
                let completionDate;
                if (typeof completion === 'string') {
                    // Legacy format: just email string, assume completed today for backward compatibility
                    completionDate = new Date();
                } else if (completion.completedAt) {
                    // New format: object with completedAt timestamp
                    completionDate = new Date(completion.completedAt);
                } else {
                    // Invalid format, skip
                    return;
                }

                if (completionDate >= today && completionDate < tomorrow) {
                    todaysSubmissions++;
                }
            });
        }
    });

    document.getElementById('classroomCount').textContent = classrooms.length;
    document.getElementById('assignmentCount').textContent = assignments.filter(a => !a.finished).length;
    document.getElementById('studentCount').textContent = totalStudents;
    document.getElementById('submissionCount').textContent = todaysSubmissions;
}

/**
 * Update classroom dropdown
 */
function updateClassroomDropdown() {
    const select = document.getElementById('assignmentClassroom');
    select.innerHTML = '<option value="">Choose a classroom...</option>' +
        classrooms.map(c => `<option value="${c.id || c._id}">${c.name}</option>`).join('');
}

/**
 * Open classroom modal
 */
function openClassroomModal() {
    document.getElementById('classroomModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open assignment modal
 */
function openAssignmentModal() {
    document.getElementById('assignmentModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open resource modal
 */
function openResourceModal() {
    document.getElementById('resourceModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Open settings modal
 */
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Close modal
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById('modalBackdrop').classList.remove('active');
}

/**
 * Save classroom
 */
function saveClassroom() {
    const name = document.getElementById('classroomName').value.trim();
    const students = document.getElementById('classroomStudents').value.trim();
    const schedule = document.getElementById('classroomSchedule').value.trim();
    const description = document.getElementById('classroomDescription').value.trim();

    if (!name || !students) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const classroom = {
        id: Date.now().toString(),
        name,
        students: [], // Initialize as array
        schedule,
        description,
        createdAt: new Date().toISOString(),
        teacher: currentTeacher.email
    };

    classrooms.push(classroom);
    localStorage.setItem('classrooms', JSON.stringify(classrooms));

    // Clear form
    document.getElementById('classroomName').value = '';
    document.getElementById('classroomStudents').value = '';
    document.getElementById('classroomSchedule').value = '';
    document.getElementById('classroomDescription').value = '';

    closeModal('classroomModal');
    renderClassrooms();
    updateStats();
    updateClassroomDropdown();
    showToast('✅ Classroom created successfully!');
}

/**
 * Save assignment
 */
function saveAssignment() {
    const title = document.getElementById('assignmentTitle').value.trim();
    const classroomId = document.getElementById('assignmentClassroom').value;
    const description = document.getElementById('assignmentDescription').value.trim();
    const dueDate = document.getElementById('assignmentDueDate').value;
    const type = document.getElementById('assignmentType').value;
    const points = document.getElementById('assignmentPoints').value.trim();

    if (!title || !classroomId || !dueDate || !type) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Get selected students
    const selectedStudents = [];
    const checkboxes = document.querySelectorAll('#studentSelection input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        const studentId = cb.value;
        const classroom = classrooms.find(c => c.id === classroomId || c._id === classroomId);
        const student = classroom.students.find(s => s.id === studentId);
        if (student) {
            selectedStudents.push({ email: student.email, studentId: student.studentId, displayName: student.displayName });
        }
    });

    const assignment = {
        id: Date.now().toString(),
        title,
        classroomId,
        description,
        dueDate,
        type,
        points: parseInt(points) || 100,
        assignedStudents: selectedStudents,
        completedBy: [],
        createdAt: new Date().toISOString(),
        teacher: currentTeacher.email
    };

    assignments.push(assignment);
    localStorage.setItem('assignments', JSON.stringify(assignments));

    // Clear form
    document.getElementById('assignmentTitle').value = '';
    document.getElementById('assignmentClassroom').value = '';
    document.getElementById('assignmentDescription').value = '';
    document.getElementById('assignmentDueDate').value = '';
    document.getElementById('assignmentType').value = '';
    document.getElementById('assignmentPoints').value = '100';

    closeModal('assignmentModal');
    renderAssignments();
    updateStats();
    renderStudentAnalytics();
    showToast('✅ Assignment created successfully!');
}

/**
 * Save resource
 */
function saveResource() {
    const title = document.getElementById('resourceTitle').value.trim();
    const type = document.getElementById('resourceType').value;
    const file = document.getElementById('resourceFile').files[0];

    if (!title || !type || !file) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const resource = {
        id: Date.now().toString(),
        title,
        type,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        teacher: currentTeacher.email
    };

    resources.push(resource);
    localStorage.setItem('resources', JSON.stringify(resources));

    // Clear form
    document.getElementById('resourceTitle').value = '';
    document.getElementById('resourceType').value = '';
    document.getElementById('resourceFile').value = '';

    closeModal('resourceModal');
    renderResources();
    showToast('✅ Resource uploaded successfully!');
}

/**
 * Save settings
 */
function saveSettings() {
    const name = document.getElementById('settingsName').value.trim();

    if (!name) {
        showToast('Please enter your name', 'error');
        return;
    }

    currentTeacher.displayName = name;
    localStorage.setItem('currentUser', JSON.stringify(currentTeacher));

    closeModal('settingsModal');
    document.getElementById('teacherName').textContent = name;
    showToast('✅ Settings saved successfully!');
}

/**
 * Delete classroom
 */
function deleteClassroom(classroomId) {
    if (confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
        classrooms = classrooms.filter(c => (c.id !== classroomId && c._id !== classroomId));
        localStorage.setItem('classrooms', JSON.stringify(classrooms));
        renderClassrooms();
        updateStats();
        updateClassroomDropdown();
        showToast('🗑️ Classroom deleted');
    }
}

/**
 * Delete assignment
 */
function deleteAssignment(assignmentId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        assignments = assignments.filter(a => (a.id !== assignmentId && a._id !== assignmentId));
        localStorage.setItem('assignments', JSON.stringify(assignments));
        renderAssignments();
        updateStats();
        showToast('🗑️ Assignment deleted');
    }
}

/**
 * Mark assignment as finished
 */
function markAssignmentFinished(assignmentId) {
    if (confirm('Are you sure you want to mark this assignment as finished? This will close it for further submissions.')) {
        const assignment = assignments.find(a => a.id === assignmentId || a._id === assignmentId);
        if (assignment) {
            assignment.finished = true;
            localStorage.setItem('assignments', JSON.stringify(assignments));
            renderAssignments();
            renderStudentAnalytics();
            showToast('✅ Assignment marked as finished');
        }
    }
}

/**
 * Delete resource
 */
function deleteResource(resourceId) {
    if (confirm('Are you sure you want to delete this resource?')) {
        resources = resources.filter(r => r.id !== resourceId);
        localStorage.setItem('resources', JSON.stringify(resources));
        renderResources();
        showToast('🗑️ Resource deleted');
    }
}

/**
 * Render assignment students
 */
function renderAssignmentStudents(assignment) {
    const studentsList = document.getElementById('assignmentStudentsList');

    if (!assignment.assignedStudents || !Array.isArray(assignment.assignedStudents) || assignment.assignedStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <i class="ri-group-line"></i>
                <p>No students assigned to this assignment.</p>
            </div>
        `;
        return;
    }

    studentsList.innerHTML = assignment.assignedStudents.map(student => {
        const isCompleted = assignment.completedBy && Array.isArray(assignment.completedBy) && assignment.completedBy.some(entry => 
            typeof entry === 'string' ? entry === student.email : entry.email === student.email
        );
        const completionInfo = isCompleted ? 
            (typeof assignment.completedBy.find(entry => (typeof entry === 'string' ? entry === student.email : entry.email === student.email)) === 'object' ? 
                `Completed on ${new Date(assignment.completedBy.find(entry => entry.email === student.email).completedAt).toLocaleDateString()}` : 
                'Completed') : 
            'Not completed';
        
        return `
        <div class="student-card ${isCompleted ? 'completed' : 'pending'}">
            <div class="student-info">
                <h4>${student.displayName}</h4>
                <p>${student.email} | ID: ${student.studentId}</p>
                <p><strong>Status:</strong> ${completionInfo}</p>
            </div>
            <div class="completion-status">
                <i class="ri-${isCompleted ? 'check-circle-fill' : 'circle'}"></i>
            </div>
        </div>
    `}).join('');
}

/**
 * View assignment
 */
function viewAssignment(assignmentId) {
    const assignment = assignments.find(a => a.id === assignmentId || a._id === assignmentId);
    if (!assignment) {
        showToast('Assignment not found', 'error');
        return;
    }

    // Update modal title and info
    document.getElementById('assignmentDetailsTitle').textContent = assignment.title;
    document.getElementById('assignmentInfo').innerHTML = `
        <strong>Description:</strong> ${assignment.description || 'No description'}<br>
        <strong>Type:</strong> ${assignment.type}<br>
        <strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}<br>
        <strong>Points:</strong> ${assignment.points}<br>
        <strong>Status:</strong> ${assignment.finished ? 'Finished' : 'Active'}<br>
        <strong>Assigned Students:</strong> ${assignment.assignedStudents ? assignment.assignedStudents.length : 0}<br>
        <strong>Completed:</strong> ${assignment.completedBy ? assignment.completedBy.length : 0}
    `;

    // Render students
    renderAssignmentStudents(assignment);

    // Open modal
    document.getElementById('assignmentDetailsModal').classList.add('active');
    document.getElementById('modalBackdrop').classList.add('active');
}

/**
 * Export analytics
 */
function exportAnalytics() {
    showToast('📥 Exporting analytics report...');
}

/**
 * Open help
 */
function openHelp() {
    alert('Help & Support\n\nFor assistance, please visit our documentation or contact support@spirit.com');
}

/**
 * Switch role
 */
function switchRole() {
    if (confirm('Are you sure you want to switch to student mode?')) {
        localStorage.removeItem('userRole');
        window.location.href = 'role-selection.html';
    }
}

/**
 * Logout
 */
function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('classrooms');
        localStorage.removeItem('assignments');
        localStorage.removeItem('resources');
        window.location.href = 'index.html';
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle theme
 */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('teacherTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme preference
window.addEventListener('load', function () {
    const savedTheme = localStorage.getItem('teacherTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
});

// Close modal when clicking on backdrop
document.addEventListener('click', function (e) {
    if (e.target.id === 'modalBackdrop') {
        document.getElementById('modalBackdrop').classList.remove('active');
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
