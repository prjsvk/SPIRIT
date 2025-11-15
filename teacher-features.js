// teacher-features.js - Teacher Tools and Feature Management

// Teacher Features Management
let teacherFeatures = JSON.parse(localStorage.getItem('teacherFeatures')) || [];
let classroom = JSON.parse(localStorage.getItem('classroom')) || {};
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let studentAnalytics = JSON.parse(localStorage.getItem('studentAnalytics')) || [];

// Add New Feature Modal
function openFeatureModal() {
    const modal = document.getElementById('featureModal') || createFeatureModal();
    modal.style.display = 'block';
}

function createFeatureModal() {
    const modal = document.createElement('div');
    modal.id = 'featureModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Feature</h2>
                <span class="close" onclick="closeModal('featureModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="featureName">Feature Name:</label>
                    <input type="text" id="featureName" placeholder="e.g., Interactive Quiz, Discussion Board" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="featureDescription">Description:</label>
                    <textarea id="featureDescription" placeholder="Describe the feature..." class="modal-input"></textarea>
                </div>
                <div class="form-group">
                    <label for="featureCategory">Category:</label>
                    <select id="featureCategory" class="modal-input">
                        <option value="engagement">Student Engagement</option>
                        <option value="assessment">Assessment</option>
                        <option value="collaboration">Collaboration</option>
                        <option value="resources">Resources</option>
                        <option value="analytics">Analytics</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="featureStatus">Status:</label>
                    <select id="featureStatus" class="modal-input">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="saveFeature()" class="modal-button primary">Save Feature</button>
                <button onclick="closeModal('featureModal')" class="modal-button secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function saveFeature() {
    const name = document.getElementById('featureName').value;
    const description = document.getElementById('featureDescription').value;
    const category = document.getElementById('featureCategory').value;
    const status = document.getElementById('featureStatus').value;

    if (!name || !description) {
        showToast('Please fill in all required fields');
        return;
    }

    const feature = {
        id: Date.now(),
        name,
        description,
        category,
        status,
        createdAt: new Date().toLocaleDateString(),
        createdBy: currentUser?.email || 'Teacher'
    };

    teacherFeatures.push(feature);
    localStorage.setItem('teacherFeatures', JSON.stringify(teacherFeatures));
    
    closeModal('featureModal');
    showToast('✨ Feature added successfully!');
    
    // Clear form
    document.getElementById('featureName').value = '';
    document.getElementById('featureDescription').value = '';
}

// Manage Classroom Modal
function openClassroomModal() {
    const modal = document.getElementById('classroomModal') || createClassroomModal();
    modal.style.display = 'block';
}

function createClassroomModal() {
    const modal = document.createElement('div');
    modal.id = 'classroomModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Classroom</h2>
                <span class="close" onclick="closeModal('classroomModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="className">Class Name:</label>
                    <input type="text" id="className" placeholder="e.g., Grade 10 Biology" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="classCode">Class Code:</label>
                    <input type="text" id="classCode" placeholder="Auto-generated" class="modal-input" readonly>
                </div>
                <div class="form-group">
                    <label for="studentCount">Number of Students:</label>
                    <input type="number" id="studentCount" placeholder="0" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="classSchedule">Class Schedule:</label>
                    <input type="text" id="classSchedule" placeholder="e.g., Mon, Wed, Fri 10:00 AM" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="classDescription">Description:</label>
                    <textarea id="classDescription" placeholder="Class objectives and details..." class="modal-input"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="saveClassroom()" class="modal-button primary">Save Classroom</button>
                <button onclick="closeModal('classroomModal')" class="modal-button secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function saveClassroom() {
    const name = document.getElementById('className').value;
    const studentCount = document.getElementById('studentCount').value;
    const schedule = document.getElementById('classSchedule').value;
    const description = document.getElementById('classDescription').value;

    if (!name || !studentCount) {
        showToast('Please fill in required fields');
        return;
    }

    classroom = {
        id: Date.now(),
        name,
        code: 'CLASS' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        studentCount,
        schedule,
        description,
        createdAt: new Date().toLocaleDateString(),
        teacher: currentUser?.email || 'Teacher'
    };

    localStorage.setItem('classroom', JSON.stringify(classroom));
    closeModal('classroomModal');
    showToast('📚 Classroom created successfully!');
}

// Create Assignment Modal
function openAssignmentModal() {
    const modal = document.getElementById('assignmentModal') || createAssignmentModal();
    modal.style.display = 'block';
}

function createAssignmentModal() {
    const modal = document.createElement('div');
    modal.id = 'assignmentModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create Assignment</h2>
                <span class="close" onclick="closeModal('assignmentModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="assignmentTitle">Assignment Title:</label>
                    <input type="text" id="assignmentTitle" placeholder="e.g., Chapter 5 Quiz" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="assignmentDescription">Description:</label>
                    <textarea id="assignmentDescription" placeholder="Assignment details..." class="modal-input"></textarea>
                </div>
                <div class="form-group">
                    <label for="dueDate">Due Date:</label>
                    <input type="datetime-local" id="dueDate" class="modal-input">
                </div>
                <div class="form-group">
                    <label for="assignmentType">Assignment Type:</label>
                    <select id="assignmentType" class="modal-input">
                        <option value="quiz">Quiz</option>
                        <option value="homework">Homework</option>
                        <option value="project">Project</option>
                        <option value="essay">Essay</option>
                        <option value="discussion">Discussion</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="maxPoints">Max Points:</label>
                    <input type="number" id="maxPoints" placeholder="100" class="modal-input" value="100">
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="saveAssignment()" class="modal-button primary">Create Assignment</button>
                <button onclick="closeModal('assignmentModal')" class="modal-button secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function saveAssignment() {
    const title = document.getElementById('assignmentTitle').value;
    const description = document.getElementById('assignmentDescription').value;
    const dueDate = document.getElementById('dueDate').value;
    const type = document.getElementById('assignmentType').value;
    const maxPoints = document.getElementById('maxPoints').value;

    if (!title || !dueDate) {
        showToast('Please fill in all required fields');
        return;
    }

    const assignment = {
        id: Date.now(),
        title,
        description,
        dueDate,
        type,
        maxPoints,
        createdAt: new Date().toLocaleDateString(),
        teacher: currentUser?.email || 'Teacher',
        submissions: []
    };

    assignments.push(assignment);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    closeModal('assignmentModal');
    showToast('📝 Assignment created successfully!');
}

// View Analytics Modal
function openAnalyticsModal() {
    const modal = document.getElementById('analyticsModal') || createAnalyticsModal();
    modal.style.display = 'block';
}

function createAnalyticsModal() {
    const modal = document.createElement('div');
    modal.id = 'analyticsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Student Analytics</h2>
                <span class="close" onclick="closeModal('analyticsModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="analytics-section">
                    <h3>📊 Class Performance Overview</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="analytics-label">Average Score</div>
                            <div class="analytics-value">78.5%</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Completion Rate</div>
                            <div class="analytics-value">92%</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Active Students</div>
                            <div class="analytics-value">28/30</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Assignments Submitted</div>
                            <div class="analytics-value">42/45</div>
                        </div>
                    </div>
                </div>
                <div class="analytics-section">
                    <h3>📈 Recent Activity</h3>
                    <ul class="activity-list">
                        <li>✅ Student 1 completed Quiz 5 - Score: 95%</li>
                        <li>📝 Student 2 submitted Essay Project</li>
                        <li>⏱️ 3 students working on Assignment</li>
                        <li>🔔 5 assignments due tomorrow</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="exportAnalytics()" class="modal-button primary">📥 Export Report</button>
                <button onclick="closeModal('analyticsModal')" class="modal-button secondary">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function exportAnalytics() {
    showToast('📥 Analytics report generated!');
}

// Resource Library Modal
function openResourcesModal() {
    const modal = document.getElementById('resourcesModal') || createResourcesModal();
    modal.style.display = 'block';
}

function createResourcesModal() {
    const modal = document.createElement('div');
    modal.id = 'resourcesModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Resource Library</h2>
                <span class="close" onclick="closeModal('resourcesModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="resource-section">
                    <h3>📚 Available Resources</h3>
                    <div class="resource-grid">
                        <div class="resource-card">
                            <i class="ri-file-pdf-line"></i>
                            <h4>Lecture Notes</h4>
                            <p>12 files</p>
                        </div>
                        <div class="resource-card">
                            <i class="ri-video-line"></i>
                            <h4>Video Tutorials</h4>
                            <p>8 files</p>
                        </div>
                        <div class="resource-card">
                            <i class="ri-presentation-line"></i>
                            <h4>Presentations</h4>
                            <p>15 files</p>
                        </div>
                        <div class="resource-card">
                            <i class="ri-function-line"></i>
                            <h4>Practice Problems</h4>
                            <p>25 files</p>
                        </div>
                    </div>
                </div>
                <div class="resource-section">
                    <h3>➕ Upload New Resource</h3>
                    <div class="upload-area">
                        <input type="file" id="resourceFile" class="modal-input">
                        <input type="text" id="resourceTitle" placeholder="Resource Title" class="modal-input">
                        <select id="resourceType" class="modal-input">
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="presentation">Presentation</option>
                            <option value="document">Document</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="uploadResource()" class="modal-button primary">📤 Upload Resource</button>
                <button onclick="closeModal('resourcesModal')" class="modal-button secondary">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function uploadResource() {
    showToast('📤 Resource uploaded successfully!');
    closeModal('resourcesModal');
}

// Helper function to close modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
