// Global variables - API_BASE comes from main.js via config.js
let allStudents = [];
let filteredStudents = [];
let statistics = null;
let metrics = null;
let currentPage = 1;
const rowsPerPage = 10;

// Optional: Log which URL is being used
console.log('📊 Dashboard page - Using API URL:', API_BASE);

// Load data on page load
document.addEventListener("DOMContentLoaded", function () {
    console.log("Dashboard loaded");
    loadAllData();
});

// Load all dashboard data
async function loadAllData() {
    showLoading();

    try {
        const [stats, modelMetrics, studentsData] = await Promise.all([
            apiCall("/dashboard/statistics").catch((err) => {
                console.error("Failed to load statistics:", err);
                return null;
            }),
            apiCall("/dashboard/model-metrics").catch((err) => {
                console.error("Failed to load metrics:", err);
                return null;
            }),
            apiCall("/dashboard/students").catch((err) => {
                console.error("Failed to load students:", err);
                return [];
            }),
        ]);

        statistics = stats;
        metrics = modelMetrics;
        allStudents = studentsData || [];
        filteredStudents = [...allStudents];

        // Check for zero scores
        const hasZeroScores = allStudents.some(
            (s) => s.predicted_score === 0,
        );
        
        const warningElement = document.getElementById("predictionWarning");
        if (warningElement) {
            warningElement.style.display = hasZeroScores ? "flex" : "none";
        }

        displayStatistics();
        displayMetrics();
        displayStudents();
    } catch (error) {
        console.error("Error loading data:", error);
        showAlert("Failed to load data", "danger");
    } finally {
        hideLoading();
    }
}

function showLoading() {
    const tbody = document.getElementById("studentsBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12">
                    <div class="spinner"></div>
                    <p class="mt-4 text-sm text-slate-500">Loading students...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoading() {
    // Optional: Add any loading hide logic here
}

function displayStatistics() {
    const statsGrid = document.getElementById("statistics");

    if (!statistics) {
        if (statsGrid) statsGrid.innerHTML = '<div class="text-slate-500 p-4 text-center col-span-4">No statistics available</div>';
        return;
    }

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Students</div>
                <div class="text-3xl font-bold text-slate-900">${statistics.total_students || 0}</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Low Risk</div>
                <div class="text-3xl font-bold text-green-600">${statistics.low_risk || 0}</div>
                <div class="text-sm text-slate-500 mt-1">${(statistics.low_risk_percentage || 0).toFixed(1)}% of total</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Medium Risk</div>
                <div class="text-3xl font-bold text-amber-600">${statistics.medium_risk || 0}</div>
                <div class="text-sm text-slate-500 mt-1">${(statistics.medium_risk_percentage || 0).toFixed(1)}% of total</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">High Risk</div>
                <div class="text-3xl font-bold text-red-600">${statistics.high_risk || 0}</div>
                <div class="text-sm text-slate-500 mt-1">${(statistics.high_risk_percentage || 0).toFixed(1)}% of total</div>
            </div>
        `;
    }
}

function displayMetrics() {
    const metricsGrid = document.getElementById("metrics");

    if (!metrics || metrics.message) {
        if (metricsGrid) metricsGrid.innerHTML = '<div class="text-slate-500 p-4 text-center col-span-4">No metrics available</div>';
        return;
    }

    if (metricsGrid) {
        metricsGrid.innerHTML = `
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Accuracy</div>
                <div class="text-3xl font-bold text-primary">${((metrics.accuracy || 0) * 100).toFixed(1)}%</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Precision</div>
                <div class="text-3xl font-bold text-primary">${((metrics.precision || 0) * 100).toFixed(1)}%</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Recall</div>
                <div class="text-3xl font-bold text-primary">${((metrics.recall || 0) * 100).toFixed(1)}%</div>
            </div>
            <div class="bg-slate-50/60 border border-slate-200 rounded-xl p-5">
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">F1-Score</div>
                <div class="text-3xl font-bold text-primary">${((metrics.f1_score || 0) * 100).toFixed(1)}%</div>
            </div>
        `;
    }
}

function displayStudents() {
    const tbody = document.getElementById("studentsBody");

    if (!tbody) return;

    if (!allStudents || allStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12">
                    <p class="text-slate-500">No student data available</p>
                </td>
            </tr>
        `;
        return;
    }

    applyFilters();

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedStudents = filteredStudents.slice(start, end);

    let html = "";
    paginatedStudents.forEach((student) => {
        const riskClass = (student.risk_status || "Low").toLowerCase();
        const attendance = student.attendance_percentage
            ? student.attendance_percentage.toFixed(1)
            : "N/A";
        const assessmentAvg = student.assessment_average
            ? student.assessment_average.toFixed(1)
            : "N/A";
        const predictedScore = student.predicted_score
            ? student.predicted_score.toFixed(1)
            : "0.0";

        html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-4 px-2 border-b border-slate-100 text-slate-700">${escapeHtml(student.matric_no) || "N/A"}</td>
                <td class="py-4 px-2 border-b border-slate-100 font-medium text-slate-900">${escapeHtml(student.student_name) || "N/A"}</td>
                <td class="py-4 px-2 border-b border-slate-100 text-slate-700">${escapeHtml(student.level) || "N/A"}</td>
                <td class="py-4 px-2 border-b border-slate-100 text-slate-700">${escapeHtml(student.department) || "N/A"}</td>
                <td class="py-4 px-2 border-b border-slate-100 text-slate-700">${attendance}${attendance !== "N/A" ? "%" : ""}</td>
                <td class="py-4 px-2 border-b border-slate-100 text-slate-700">${assessmentAvg}</td>
                <td class="py-4 px-2 border-b border-slate-100 font-semibold text-primary">${predictedScore}</td>
                <td class="py-4 px-2 border-b border-slate-100">
                    <span class="risk-badge ${riskClass}">${escapeHtml(student.risk_status) || "Unknown"}</span>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    updatePagination();
}

// Escape HTML to prevent XSS attacks - UPDATED VERSION
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    if (typeof unsafe !== 'string') {
        unsafe = String(unsafe); // Convert to string first
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applyFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const levelFilter = document.getElementById("levelFilter")?.value || "";
    const riskFilter = document.getElementById("riskFilter")?.value || "";

    filteredStudents = allStudents.filter((student) => {
        const matchesSearch =
            searchTerm === "" ||
            (student.student_name &&
                student.student_name.toLowerCase().includes(searchTerm)) ||
            (student.matric_no &&
                student.matric_no.toLowerCase().includes(searchTerm));

        const matchesLevel =
            levelFilter === "" || student.level == levelFilter;
        const matchesRisk =
            riskFilter === "" || student.risk_status === riskFilter;

        return matchesSearch && matchesLevel && matchesRisk;
    });

    currentPage = 1;
}

function filterStudents() {
    displayStudents();
}

function updatePagination() {
    const paginationDiv = document.getElementById("pagination");
    if (!paginationDiv) return;

    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

    if (totalPages <= 1) {
        paginationDiv.innerHTML = "";
        return;
    }

    let html = '<div class="flex items-center gap-2">';
    
    // Previous button
    html += `<button 
        onclick="changePage(${currentPage - 1})" 
        ${currentPage === 1 ? 'disabled' : ''}
        class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="px-4 py-2 rounded-xl bg-primary text-white font-semibold">${i}</button>`;
        } else {
            html += `<button onclick="changePage(${i})" class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all">${i}</button>`;
        }
    }
    
    // Next button
    html += `<button 
        onclick="changePage(${currentPage + 1})" 
        ${currentPage === totalPages ? 'disabled' : ''}
        class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >Next</button>`;
    
    html += '</div>';
    paginationDiv.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    displayStudents();
}

async function generatePredictions() {
    try {
        const refreshBtn = document.getElementById("refreshBtn");
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span class="material-symbols-outlined text-lg">refresh</span> Refresh';
        }

        const result = await apiCall("/prediction/generate-all", "POST");
        showAlert(
            `Generated predictions for ${result.predictions?.length || 0} students`,
        );
        await loadAllData();
    } catch (error) {
        console.error("Failed to generate predictions:", error);
        showAlert("Failed to generate predictions", "danger");
    } finally {
        const refreshBtn = document.getElementById("refreshBtn");
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = "↻ Refresh";
        }
    }
}

async function refreshDashboard() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="material-symbols-outlined text-lg animate-spin">refresh</span> Refreshing...';
    }
    // After load:
    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="material-symbols-outlined text-lg">refresh</span> Refresh';
    }
}

function forceReload() {
    loadAllData();
}

function exportToCSV() {
    if (!filteredStudents || filteredStudents.length === 0) {
        showAlert("No data to export", "warning");
        return;
    }

    const headers = [
        "Matric No",
        "Name",
        "Level",
        "Department",
        "Attendance %",
        "Assessment Avg",
        "Predicted Score",
        "Risk Status",
    ];
    
    const rows = filteredStudents.map((s) => [
        s.matric_no || "N/A",
        s.student_name || "N/A",
        s.level || "N/A",
        s.department || "N/A",
        s.attendance_percentage ? s.attendance_percentage.toFixed(1) : "N/A",
        s.assessment_average ? s.assessment_average.toFixed(1) : "N/A",
        s.predicted_score ? s.predicted_score.toFixed(1) : "0.0",
        s.risk_status || "Unknown",
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student_risk_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Debug functions
async function debugPredictions() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    try {
        const data = await apiCall("/prediction/all");
        output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
        output.innerHTML = `Error: ${err.message}`;
    }
}

async function debugStudents() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    output.innerHTML = `<pre>${JSON.stringify(allStudents, null, 2)}</pre>`;
}

async function debugAssessments() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    try {
        const data = await apiCall("/lecturer/assessments/");
        output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
        output.innerHTML = `Error: ${err.message}`;
    }
}

async function testPredictionGeneration() {
    const output = document.getElementById("debugOutput");
    if (!output) return;
    
    try {
        const students = await apiCall("/admin/students/");
        if (students.length === 0) {
            output.innerHTML = "No students found";
            return;
        }
        const result = await apiCall(
            `/prediction/generate/${students[0].id}`,
            "POST",
        );
        output.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        await loadAllData();
    } catch (err) {
        output.innerHTML = `Error: ${err.message}`;
    }
}

// Make functions global
window.refreshDashboard = refreshDashboard;
window.filterStudents = filterStudents;
window.exportToCSV = exportToCSV;
window.changePage = changePage;
window.generatePredictions = generatePredictions;
window.forceReload = forceReload;
window.debugPredictions = debugPredictions;
window.debugStudents = debugStudents;
window.debugAssessments = debugAssessments;
window.testPredictionGeneration = testPredictionGeneration;