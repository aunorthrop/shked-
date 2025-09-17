// Global state
let employees = [];
let requirements = {};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
    '6:00-10:00', '10:00-14:00', '14:00-18:00', '18:00-22:00'
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeRequirements();
    loadSampleData();
});

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function addEmployee() {
    const nameInput = document.getElementById('employeeName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter an employee name');
        return;
    }
    
    if (employees.find(emp => emp.name === name)) {
        alert('Employee already exists');
        return;
    }
    
    const employee = {
        id: Date.now(),
        name: name,
        availability: {}
    };
    
    // Initialize availability
    days.forEach(day => {
        employee.availability[day] = [];
    });
    
    employees.push(employee);
    nameInput.value = '';
    renderEmployees();
}

function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        employees = employees.filter(emp => emp.id !== employeeId);
        renderEmployees();
    }
}

function updateAvailability(employeeId, day, timeSlot, checked) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    if (checked) {
        if (!employee.availability[day].includes(timeSlot)) {
            employee.availability[day].push(timeSlot);
        }
    } else {
        employee.availability[day] = employee.availability[day].filter(slot => slot !== timeSlot);
    }
}

function renderEmployees() {
    const container = document.getElementById('employeeList');
    container.innerHTML = '';
    
    employees.forEach(employee => {
        const employeeDiv = document.createElement('div');
        employeeDiv.className = 'employee-card';
        
        employeeDiv.innerHTML = `
            <h3>${employee.name}</h3>
            <div class="availability-grid">
                ${days.map((day, index) => `
                    <div class="day-availability">
                        <h4>${dayNames[index]}</h4>
                        <div class="time-slots">
                            ${timeSlots.map(slot => `
                                <label class="time-slot">
                                    <input type="checkbox" 
                                           ${employee.availability[day].includes(slot) ? 'checked' : ''}
                                           onchange="updateAvailability(${employee.id}, '${day}', '${slot}', this.checked)">
                                    <span>${slot}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="delete-btn" onclick="deleteEmployee(${employee.id})">Delete Employee</button>
        `;
        
        container.appendChild(employeeDiv);
    });
}

function initializeRequirements() {
    days.forEach(day => {
        requirements[day] = {};
        timeSlots.forEach(slot => {
            requirements[day][slot] = 1;
        });
    });
    
    renderRequirements();
}

function renderRequirements() {
    const container = document.getElementById('dayRequirements');
    container.innerHTML = '';
    
    days.forEach((day, index) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-requirement';
        
        dayDiv.innerHTML = `
            <h4>${dayNames[index]}</h4>
            ${timeSlots.map(slot => `
                <div class="shift-requirement">
                    <span>${slot}</span>
                    <input type="number" 
                           min="0" 
                           max="10" 
                           value="${requirements[day][slot]}"
                           onchange="updateRequirement('${day}', '${slot}', this.value)">
                </div>
            `).join('')}
        `;
        
        container.appendChild(dayDiv);
    });
}

function updateRequirement(day, slot, value) {
    requirements[day][slot] = parseInt(value) || 0;
}

function generateSchedule() {
    if (employees.length === 0) {
        alert('Please add employees first');
        return;
    }
    
    const schedule = {};
    
    days.forEach(day => {
        schedule[day] = {};
        
        timeSlots.forEach(slot => {
            const needed = requirements[day][slot];
            const available = employees.filter(emp => 
                emp.availability[day].includes(slot)
            );
            
            // Simple AI algorithm: assign employees based on availability and fairness
            const assigned = assignEmployees(available, needed, day, slot);
            schedule[day][slot] = assigned;
        });
    });
    
    renderSchedule(schedule);
    showTab('schedule');
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-button')[2].classList.add('active');
}

function assignEmployees(availableEmployees, needed, day, slot) {
    // Sort by current workload (employees with fewer assignments get priority)
    const workloadCount = {};
    availableEmployees.forEach(emp => {
        workloadCount[emp.id] = getEmployeeWorkload(emp.id);
    });
    
    const sorted = availableEmployees.sort((a, b) => 
        workloadCount[a.id] - workloadCount[b.id]
    );
    
    return sorted.slice(0, needed);
}

function getEmployeeWorkload(employeeId) {
    // Count how many shifts this employee is currently assigned
    let count = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            const assigned = requirements[day] && requirements[day][slot] ? 
                employees.filter(emp => emp.availability[day].includes(slot)).slice(0, requirements[day][slot]) : [];
            if (assigned.find(emp => emp.id === employeeId)) {
                count++;
            }
        });
    });
    return count;
}

function renderSchedule(schedule) {
    const container = document.getElementById('generatedSchedule');
    container.innerHTML = '';
    
    const scheduleGrid = document.createElement('div');
    scheduleGrid.className = 'schedule-grid';
    
    days.forEach((day, index) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-schedule';
        
        dayDiv.innerHTML = `
            <h3>${dayNames[index]}</h3>
            ${timeSlots.map(slot => `
                <div class="shift-assignment">
                    <div class="time">${slot}</div>
                    <div class="employees">
                        ${schedule[day][slot].length > 0 ? 
                            schedule[day][slot].map(emp => emp.name).join(', ') : 
                            'No one available'
                        }
                    </div>
                </div>
            `).join('')}
        `;
        
        scheduleGrid.appendChild(dayDiv);
    });
    
    container.appendChild(scheduleGrid);
}

function exportSchedule() {
    const scheduleDiv = document.getElementById('generatedSchedule');
    if (!scheduleDiv.innerHTML) {
        alert('Please generate a schedule first');
        return;
    }
    
    // Create a simple text export
    let exportText = 'WEEKLY SCHEDULE\n';
    exportText += '================\n\n';
    
    days.forEach((day, index) => {
        exportText += `${dayNames[index].toUpperCase()}\n`;
        exportText += '-'.repeat(dayNames[index].length) + '\n';
        
        timeSlots.forEach(slot => {
            const daySchedule = document.querySelector(`#generatedSchedule .day-schedule:nth-child(${index + 1})`);
            const shiftDiv = daySchedule.querySelectorAll('.shift-assignment')[timeSlots.indexOf(slot)];
            const employees = shiftDiv.querySelector('.employees').textContent.trim();
            
            exportText += `${slot}: ${employees}\n`;
        });
        
        exportText += '\n';
    });
    
    // Create download
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function loadSampleData() {
    // Add sample employees for demo
    const sampleEmployees = [
        { name: 'Alice Johnson', availability: {
            monday: ['6:00-10:00', '10:00-14:00'],
            tuesday: ['10:00-14:00', '14:00-18:00'],
            wednesday: ['6:00-10:00', '18:00-22:00'],
            thursday: ['10:00-14:00', '14:00-18:00'],
            friday: ['14:00-18:00', '18:00-22:00'],
            saturday: ['6:00-10:00', '10:00-14:00', '14:00-18:00'],
            sunday: ['10:00-14:00']
        }},
        { name: 'Bob Smith', availability: {
            monday: ['14:00-18:00', '18:00-22:00'],
            tuesday: ['6:00-10:00', '18:00-22:00'],
            wednesday: ['10:00-14:00', '14:00-18:00'],
            thursday: ['6:00-10:00', '18:00-22:00'],
            friday: ['6:00-10:00', '10:00-14:00'],
            saturday: ['14:00-18:00', '18:00-22:00'],
            sunday: ['6:00-10:00', '14:00-18:00', '18:00-22:00']
        }},
        { name: 'Carol Davis', availability: {
            monday: ['10:00-14:00', '14:00-18:00'],
            tuesday: ['14:00-18:00'],
            wednesday: ['6:00-10:00', '10:00-14:00'],
            thursday: ['14:00-18:00', '18:00-22:00'],
            friday: ['10:00-14:00', '18:00-22:00'],
            saturday: ['6:00-10:00', '18:00-22:00'],
            sunday: ['6:00-10:00', '10:00-14:00', '18:00-22:00']
        }}
    ];
    
    sampleEmployees.forEach(sample => {
        const employee = {
            id: Date.now() + Math.random(),
            name: sample.name,
            availability: sample.availability
        };
        employees.push(employee);
    });
    
    renderEmployees();
}
