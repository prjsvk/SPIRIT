// home.js - Spirit Enhanced Backend with Timer Pause/Resume + Dark/Light Mode Ready

// home.js - Spirit Enhanced Backend with Timer Pause/Resume + Dark/Light Mode Ready

let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let studyGroups = JSON.parse(localStorage.getItem('studyGroups')) || [];
let tasks = [];

let timer = null;
let timerPaused = false;
let timerTimeLeft = 0;

window.onload = () => {
    // Load tasks from localStorage first
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // If there's a current user, prioritize their tasks, otherwise use stored tasks
    if (currentUser) {
        tasks = currentUser.tasks || storedTasks;
        // Update currentUser's tasks if they were loaded from storedTasks
        if (!currentUser.tasks && storedTasks.length > 0) {
            currentUser.tasks = storedTasks;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } else {
        tasks = storedTasks;
    }

    // Initialize completed property for existing tasks
    tasks = tasks.map(task => ({
        ...task,
        completed: task.completed || false
    }));

    // Save tasks back to localStorage to maintain consistency
    localStorage.setItem('tasks', JSON.stringify(tasks));

    if (currentUser || tasks.length > 0) {
        updateTaskSelect();
        generateTimeline();
        renderStudyGroups();
        updateChronoQuote();
    }

    // Display student ID if student and load assignments
    if (currentUser && currentUser.role === 'student') {
        const studentIdEl = document.getElementById('studentIdDisplay');
        if (studentIdEl) {
            studentIdEl.textContent = `Student ID: ${currentUser.studentId || 'Not assigned'}`;
        }
        generateTimeline(); // Update timeline with assignments
        
        // Hide teacher tools for students
        const teacherToolsDropdown = document.querySelector('.nav-dropdown');
        if (teacherToolsDropdown) {
            teacherToolsDropdown.style.display = 'none';
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
};

// ... rest of the code remains the same ...

function showToast(message, duration = 3000) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function updateChronoQuote() {
    const chronoQuotes = [
        "Time bends for the bold. Shape it.",
        "Chrono sync complete. Let's elevate your day.",
        "Productivity isn't about time—it's about intention."
    ];
    const quote = chronoQuotes[Math.floor(Math.random() * chronoQuotes.length)];
    const quoteEl = document.getElementById("chronoQuote");
    if (quoteEl) quoteEl.innerText = quote;
}

function saveTasks() {
    if (currentUser) {
        currentUser.tasks = tasks;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function sortTasksByPriority(tasks) {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    
    return tasks.sort((a, b) => {
        // First, sort by completion status (incomplete first)
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        // Then sort by priority (higher priority first)
        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;
        
        if (priorityA !== priorityB) {
            return priorityB - priorityA;
        }
        
        // If same priority, sort by deadline (earlier first)
        const deadlineA = new Date(a.deadline);
        const deadlineB = new Date(b.deadline);
        return deadlineA - deadlineB;
    });
}

function completeTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    updateTaskSelect();
    generateTimeline();
    showToast(tasks[index].completed ? "Task completed! ✅" : "Task marked as incomplete");
}

function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks.splice(index, 1);
        saveTasks();
        updateTaskSelect();
        generateTimeline();
        showToast('Task deleted');
    }
}

function addTask() {
    const name = document.getElementById("taskName").value;
    const duration = parseInt(document.getElementById("duration").value);
    const deadline = document.getElementById("deadline").value;
    const priority = document.getElementById("priority").value;

    if (!name || !duration || !deadline) {
        showToast("Missing task info! Complete your quest 📝");
        return;
    }

    const task = { name, duration, deadline, priority };
    tasks.push(task);
    saveTasks();
    updateTaskSelect();
    generateTimeline();

    document.getElementById("taskName").value = "";
    document.getElementById("duration").value = "";
    showToast("+1 Task added to the timeline 🌌");
}

function updateTaskSelect() {
    const select = document.getElementById("taskSelect");
    select.innerHTML = "";
    
    // Only show incomplete tasks in the timer dropdown
    const incompleteTasks = tasks.filter(task => !task.completed);
    incompleteTasks.forEach((task, i) => {
        select.innerHTML += `<option value="${tasks.indexOf(task)}">${task.name}</option>`;
    });
}

function generateTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    timeline.innerHTML = "";

    // Get assignments from localStorage
    const assignments = JSON.parse(localStorage.getItem('assignments')) || [];

    // Filter assignments for current student
    const studentAssignments = assignments.filter(assignment =>
        assignment.assignedStudents && assignment.assignedStudents.some(student =>
            student.email === currentUser.email || student.studentId === currentUser.studentId
        )
    );

    // Show all personal tasks first
    if (tasks.length > 0) {
        const personalTasksSection = document.createElement('div');
        personalTasksSection.className = 'personal-tasks-section';
        personalTasksSection.innerHTML = '<h4 style="margin: 0 0 0.5rem 0; color: #10b981; font-size: 1.2rem;">Personal Tasks</h4>';

        // Sort tasks by priority and completion status
        const sortedTasks = sortTasksByPriority([...tasks]);

        // Add interactive task list with checkboxes
        const taskList = document.createElement('ul');
        taskList.className = 'task-list';
        taskList.style.listStyle = 'none';
        taskList.style.padding = '0';
        taskList.style.margin = '0.5rem 0';

        sortedTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.padding = '0.5rem';
            li.style.marginBottom = '0.25rem';
            li.style.borderRadius = '0.25rem';
            
            // Color code tasks based on priority
            let backgroundColor = '#334155'; // default
            if (task.priority === 'high') {
                backgroundColor = 'rgba(239, 68, 68, 0.2)'; // red background for high priority
                li.style.borderLeft = '4px solid #ef4444';
            } else if (task.priority === 'medium') {
                backgroundColor = 'rgba(245, 158, 11, 0.2)'; // orange background for medium priority
                li.style.borderLeft = '4px solid #f59e0b';
            } else if (task.priority === 'low') {
                backgroundColor = 'rgba(16, 185, 129, 0.2)'; // green background for low priority
                li.style.borderLeft = '4px solid #10b981';
            }
            
            li.style.background = backgroundColor;
            
            // Apply completed styling
            if (task.completed) {
                li.style.opacity = '0.6';
                li.style.textDecoration = 'line-through';
            }

            const originalIndex = tasks.indexOf(task);
            li.innerHTML = `
                <input type="checkbox" id="task-${index}" onchange="completeTask(${originalIndex})" ${task.completed ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer; margin-right: 0.5rem;">
                <label for="task-${index}" style="flex: 1; cursor: pointer; color: #e2e8f0; font-weight: 500; ${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.name} - ${task.duration} mins - ${task.priority}</label>
                <button onclick="deleteTask(${originalIndex})" style="margin-left: 0.5rem; background: #dc2626; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.8rem; text-decoration: none;">Delete</button>
            `;
            taskList.appendChild(li);
        });

        personalTasksSection.appendChild(taskList);

        const personalContainer = document.createElement('div');
        personalContainer.className = 'assignment-container';
        personalContainer.style.cssText = `
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid #334155;
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1rem;
        `;

        personalContainer.appendChild(personalTasksSection);
        timeline.appendChild(personalContainer);
    }

    if (studentAssignments.length === 0) {
        if (tasks.length === 0) {
            timeline.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No tasks or assignments scheduled.</p>';
        }
        return;
    }

    studentAssignments.forEach(assignment => {
        const assignmentDate = new Date(assignment.dueDate).toDateString();
        const today = new Date().toDateString();
        const isDueToday = assignmentDate === today;

        // Check if assignment is completed by current user
        const isCompleted = assignment.completedBy && assignment.completedBy.some(entry => 
            typeof entry === 'string' ? entry === currentUser.email : entry.email === currentUser.email
        );

        // Assignment header
        const assignmentHeader = document.createElement('div');
        assignmentHeader.className = 'assignment-header';
        assignmentHeader.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="checkbox" id="assignment-${assignment.id}" onchange="markTaskCompleted('${assignment.id}')" ${isCompleted ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer; margin-right: 0.75rem;">
                <h4 style="margin: 0; color: #60a5fa; font-size: 1.1rem; font-weight: 600; ${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${assignment.title}</h4>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #cbd5e1;">
                <span>Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                <span>Points: ${assignment.points}</span>
            </div>
            ${assignment.description ? `<p style="margin: 0.5rem 0; font-size: 0.9rem; color: #e2e8f0; font-weight: 500; ${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${assignment.description}</p>` : ''}
        `;

        // Combine assignment header and personal tasks
        const assignmentContainer = document.createElement('div');
        assignmentContainer.className = 'assignment-container';
        assignmentContainer.style.cssText = `
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid #334155;
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1rem;
            ${isDueToday ? 'border-color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);' : ''}
            ${isCompleted ? 'opacity: 0.7; border-color: #10b981;' : ''}
        `;

        assignmentContainer.appendChild(assignmentHeader);
        timeline.appendChild(assignmentContainer);
    });
}

function startTimer() {
    const taskIndex = parseInt(document.getElementById("taskSelect").value);
    if (isNaN(taskIndex) || !tasks[taskIndex]) {
        showToast('Please select a task');
        return;
    }
    const task = tasks[taskIndex];
    timerTimeLeft = task.duration * 60;
    runTimer();
}

function runTimer() {
    clearInterval(timer);
    timerPaused = false;
    timer = setInterval(() => {
        const mins = Math.floor(timerTimeLeft / 60).toString().padStart(2, '0');
        const secs = (timerTimeLeft % 60).toString().padStart(2, '0');
        document.getElementById("timerDisplay").innerText = `${mins}:${secs}`;

        if (timerTimeLeft === 0) {
            clearInterval(timer);
            document.getElementById("productivity-feedback").innerText = "Well done! Task complete ✅";
            new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3').play();
        }
        timerTimeLeft--;
    }, 1000);
}

function pauseResumeTimer() {
    if (timerPaused) {
        runTimer();
        showToast("Timer resumed ▶");
    } else {
        clearInterval(timer);
        showToast("Timer paused ⏸");
    }
    timerPaused = !timerPaused;
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
    timerTimeLeft = 0;
    document.getElementById("timerDisplay").innerText = "00:00";
    document.getElementById("productivity-feedback").innerText = "";
}

function renderStudyGroups() {
    const container = document.getElementById('studyGroupsList');
    if (!container) return;
    container.innerHTML = '';

    const userGroups = studyGroups.filter(group =>
        group.members.includes(currentUser.email) || group.createdBy === currentUser.email
    );

    if (userGroups.length === 0) {
        container.innerHTML = '<p>No study groups yet. Create one!</p>';
        return;
    }

    userGroups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'study-group-card';
        groupEl.innerHTML = `
            <h4>${group.name}</h4>
            <p>Members: ${group.members.join(', ')}</p>
            <button onclick="viewGroup(${group.id})" class="dashboard-button" style="margin-top: 0.5rem;">View Group</button>
        `;
        container.appendChild(groupEl);
    });
}

function viewGroup(groupId) {
    const group = studyGroups.find(g => g.id === groupId);
    if (group) {
        showToast(`Viewing group: ${group.name}`);
    }
}

function markTaskCompleted(taskId) {
    const assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    const task = assignments.find(a => a.id === taskId);
    if (task) {
        if (!task.completedBy) task.completedBy = [];
        
        const currentUserEntry = task.completedBy.find(entry => 
            typeof entry === 'string' ? entry === currentUser.email : entry.email === currentUser.email
        );
        
        if (currentUserEntry) {
            // Remove completion (uncheck)
            task.completedBy = task.completedBy.filter(entry => 
                typeof entry === 'string' ? entry !== currentUser.email : entry.email !== currentUser.email
            );
            localStorage.setItem('assignments', JSON.stringify(assignments));
            generateTimeline();
            showToast('Assignment marked as incomplete');
        } else {
            // Add completion (check)
            task.completedBy.push({
                email: currentUser.email,
                completedAt: new Date().toISOString()
            });
            localStorage.setItem('assignments', JSON.stringify(assignments));
            generateTimeline();
            showToast('Assignment completed! ✅');
        }
    }
}