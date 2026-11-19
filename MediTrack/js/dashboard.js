/**
 * MediTrack - Dashboard Logic & Controller
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const Dashboard = {
    init() {
        this.loadDashboard();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Dashboard listeners
    },

    loadDashboard() {
        const stats = StorageManager.getDashboardStats();
        this.renderStats(stats);
        this.renderDaysCompletedAndStreak(stats.daysStats);
        this.renderUserWeight(stats.userProfile);
        this.renderWeeklyCheckup(stats.nextCheckup);
        this.renderLowStockAlert(stats.lowStockMedicines);
        this.renderTodaySchedule(stats.todayLogs);
        this.renderUpcomingReminders();
    },

    // ---------------------------------------------
    // Render Days Completed & Adherence Streak
    // Streak is strictly counted after full completion of each day
    // ---------------------------------------------
    renderDaysCompletedAndStreak(daysStats) {
        const daysEl = document.getElementById('stat-days-completed');
        const streakEl = document.getElementById('stat-streak-badge');
        const streakTextEl = document.getElementById('dashboard-streak-banner-text');

        if (daysEl) {
            daysEl.textContent = `${daysStats.totalDaysCompleted} Day${daysStats.totalDaysCompleted === 1 ? '' : 's'}`;
        }

        if (streakEl) {
            streakEl.innerHTML = `<i class="fas fa-fire text-danger me-1"></i> ${daysStats.streakDays} Day Streak`;
        }

        if (streakTextEl) {
            if (daysStats.isTodayCompleted) {
                streakTextEl.innerHTML = `<span class="badge bg-success text-white px-3 py-1 rounded-pill me-2"><i class="fas fa-check-circle"></i> Today Completed!</span> <span class="badge bg-warning text-dark px-3 py-1 rounded-pill me-2"><i class="fas fa-fire text-danger"></i> ${daysStats.streakDays}-Day Streak</span> Great job! All doses for today are completed.`;
            } else if (daysStats.streakDays > 0) {
                streakTextEl.innerHTML = `<span class="badge bg-warning text-dark px-3 py-1 rounded-pill me-2"><i class="fas fa-fire text-danger"></i> ${daysStats.streakDays}-Day Completed Streak</span> Complete all remaining doses today to extend your streak to ${daysStats.streakDays + 1} days!`;
            } else {
                streakTextEl.innerHTML = `<span><i class="far fa-calendar-check text-warning me-1"></i> Complete all of today's scheduled doses to start your daily adherence streak!</span>`;
            }
        }
    },

    // ---------------------------------------------
    // Render User Weight Widget & Logging
    // ---------------------------------------------
    renderUserWeight(userProfile) {
        const weightValEl = document.getElementById('dash-weight-val');
        const weightSubEl = document.getElementById('dash-weight-sub');

        if (weightValEl) {
            if (userProfile && userProfile.current_weight) {
                weightValEl.textContent = `${userProfile.current_weight} ${userProfile.weight_unit || 'kg'}`;
            } else {
                weightValEl.textContent = '-- kg';
            }
        }

        if (weightSubEl) {
            if (userProfile && userProfile.current_weight) {
                if (userProfile.target_weight) {
                    weightSubEl.textContent = `Target: ${userProfile.target_weight} ${userProfile.weight_unit || 'kg'}`;
                } else if (userProfile.last_updated) {
                    weightSubEl.textContent = `Updated ${StorageManager.formatDateForDisplay(userProfile.last_updated.split('T')[0])}`;
                } else {
                    weightSubEl.textContent = 'Track your daily weight';
                }
            } else {
                weightSubEl.textContent = 'Tap to record weight';
            }
        }
    },

    openWeightModal() {
        const profile = StorageManager.getUserProfile();
        const modalId = 'log-weight-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const currentWeightVal = (profile.current_weight !== null && profile.current_weight !== undefined) ? profile.current_weight : '';

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-primary text-white py-3">
                            <h6 class="modal-title fw-bold mb-0"><i class="fas fa-weight-scale me-2"></i> Log Body Weight</h6>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4">
                            <label class="form-label-custom small">Current Weight (${profile.weight_unit || 'kg'}):</label>
                            <div class="input-group mb-3">
                                <input type="number" step="0.1" class="form-control form-control-custom fw-bold fs-5 text-center" id="input-new-weight" value="${currentWeightVal}" placeholder="e.g. 65.0" required>
                                <span class="input-group-text bg-light fw-bold">${profile.weight_unit || 'kg'}</span>
                            </div>

                            <label class="form-label-custom small">Optional Note:</label>
                            <input type="text" class="form-control form-control-custom small mb-3" id="input-weight-note" placeholder="e.g. Fasting, Morning weigh-in">

                            <div class="d-flex gap-2 justify-content-end">
                                <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                                <button type="button" class="btn btn-sm btn-primary rounded-pill px-4 shadow-sm" onclick="Dashboard.handleSaveWeight('${modalId}')">
                                    Save Weight
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    handleSaveWeight(modalId) {
        const input = document.getElementById('input-new-weight');
        const noteInput = document.getElementById('input-weight-note');
        const profile = StorageManager.getUserProfile();

        const val = input ? parseFloat(input.value) : 0;
        if (isNaN(val) || val <= 0) {
            App.showToast('Please enter a valid weight number.', 'warning');
            return;
        }

        const note = noteInput ? noteInput.value : '';
        StorageManager.logUserWeight(val, profile.weight_unit || 'kg', note);

        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        App.showToast(`Weight recorded: ${val} ${profile.weight_unit || 'kg'}`, 'success');
        this.renderUserWeight(StorageManager.getUserProfile());
    },

    // ---------------------------------------------
    // Render Next Weekly Checkup Card
    // ---------------------------------------------
    renderWeeklyCheckup(nextCheckup) {
        const container = document.getElementById('dash-weekly-checkup-card');
        if (!container) return;

        if (!nextCheckup) {
            container.innerHTML = `
                <div class="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                    <div class="d-flex align-items-center gap-3">
                        <div class="stat-icon-wrapper bg-info-subtle text-info rounded-circle" style="width: 44px; height: 44px;">
                            <i class="fas fa-calendar-plus fa-lg"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark small">No Weekly Checkups Configured</div>
                            <div class="text-muted" style="font-size: 0.775rem;">Set up doctor appointments or regular clinical checkups</div>
                        </div>
                    </div>
                    <a href="reminders.html" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                        + Add Checkup
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-between p-3 rounded-3 border" style="background: linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%);">
                <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-info text-white rounded-circle shadow-sm" style="width: 44px; height: 44px;">
                        <i class="fas fa-stethoscope"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-bold text-dark">${App.escapeHtml(nextCheckup.title)}</span>
                            <span class="badge bg-info text-dark rounded-pill px-2 py-1" style="font-size: 0.7rem;">Every ${App.escapeHtml(nextCheckup.day_of_week)}</span>
                        </div>
                        <div class="text-muted small">
                            <i class="far fa-clock text-primary me-1"></i> ${StorageManager.formatTimeForDisplay(nextCheckup.time)} &bull; 
                            <i class="fas fa-user-md text-info me-1"></i> ${App.escapeHtml(nextCheckup.doctor_name)} &bull; 
                            <i class="fas fa-location-dot text-danger me-1"></i> ${App.escapeHtml(nextCheckup.location)}
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="Dashboard.handleCheckupDone('${nextCheckup.id}')">
                        <i class="fas fa-check me-1"></i> Attended
                    </button>
                    <a href="reminders.html" class="btn btn-sm btn-outline-secondary rounded-circle" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;" title="Manage Checkups">
                        <i class="fas fa-gear"></i>
                    </a>
                </div>
            </div>
        `;
    },

    handleCheckupDone(checkupId) {
        StorageManager.markCheckupCompleted(checkupId);
        App.showToast('Weekly checkup marked as attended!', 'success');
        this.renderWeeklyCheckup(StorageManager.getNextWeeklyCheckup());
    },

    // ---------------------------------------------
    // Render Summary Metric Cards
    // ---------------------------------------------
    renderStats(stats) {
        const totalMedEl = document.getElementById('stat-total-medicines');
        const scheduledEl = document.getElementById('stat-today-scheduled');
        const completedEl = document.getElementById('stat-today-completed');
        const pendingEl = document.getElementById('stat-today-pending');
        const missedEl = document.getElementById('stat-today-missed');

        if (totalMedEl) totalMedEl.textContent = stats.totalMedicines;
        if (scheduledEl) scheduledEl.textContent = stats.totalScheduledDoses;
        if (completedEl) completedEl.textContent = stats.completedDoses;
        if (pendingEl) pendingEl.textContent = stats.pendingDoses;
        if (missedEl) missedEl.textContent = stats.missedDoses;

        // Progress bar calculation
        const progressEl = document.getElementById('dashboard-adherence-progress');
        const progressTextEl = document.getElementById('dashboard-adherence-text');
        if (progressEl && progressTextEl) {
            if (stats.totalScheduledDoses === 0) {
                progressEl.style.width = '0%';
                progressTextEl.textContent = 'No doses scheduled for today';
            } else {
                const percentage = Math.round((stats.completedDoses / stats.totalScheduledDoses) * 100);
                progressEl.style.width = `${percentage}%`;
                progressTextEl.textContent = `${percentage}% completed (${stats.completedDoses} of ${stats.totalScheduledDoses} doses)`;
            }
        }
    },

    // ---------------------------------------------
    // Render Low Stock Alert Banner
    // ---------------------------------------------
    renderLowStockAlert(lowStockMedicines) {
        const container = document.getElementById('dashboard-alerts-container');
        if (!container) return;

        if (!lowStockMedicines || lowStockMedicines.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const medList = lowStockMedicines.map(m => `
            <span class="badge bg-warning text-dark me-2 mb-1 p-2">
                <i class="fas fa-exclamation-circle me-1"></i> ${App.escapeHtml(m.medicine_name)} (${m.remaining_quantity} left)
            </span>
        `).join('');

        container.innerHTML = `
            <div class="banner-low-stock mb-4 shadow-sm">
                <div class="d-flex align-items-start gap-3">
                    <div class="stat-icon-wrapper bg-warning text-white rounded-circle flex-shrink-0" style="width: 44px; height: 44px;">
                        <i class="fas fa-triangle-exclamation"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="fw-bold text-dark mb-1">Low Medicine Stock Alert</h6>
                        <p class="small text-muted mb-2">The following medicines are running low. Please replenish your supply soon:</p>
                        <div class="d-flex flex-wrap">${medList}</div>
                    </div>
                    <a href="medicines.html" class="btn btn-sm btn-outline-dark fw-semibold rounded-pill px-3">
                        Manage Medicines
                    </a>
                </div>
            </div>
        `;
    },

    // ---------------------------------------------
    // Render Today's Medicine Schedule
    // ---------------------------------------------
    renderTodaySchedule(todayLogs) {
        const container = document.getElementById('today-schedule-list');
        const emptyState = document.getElementById('today-schedule-empty');
        if (!container) return;

        if (!todayLogs || todayLogs.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const typeIconMap = {
            'Tablet': 'fa-tablets text-primary',
            'Capsule': 'fa-capsules text-info',
            'Syrup': 'fa-prescription-bottle-medical text-danger',
            'Injection': 'fa-syringe text-warning',
            'Drops': 'fa-eye-dropper text-teal',
            'Inhaler': 'fa-lungs text-success',
            'Other': 'fa-pills text-secondary'
        };

        const html = todayLogs.map(log => {
            const isTaken = log.status === 'Taken';
            const isMissed = log.status === 'Missed';
            const isPending = log.status === 'Pending';

            let statusBadge = '';
            if (isTaken) {
                statusBadge = '<span class="badge-status status-taken"><i class="fas fa-check-circle"></i> Taken</span>';
            } else if (isMissed) {
                statusBadge = '<span class="badge-status status-missed"><i class="fas fa-circle-xmark"></i> Missed</span>';
            } else {
                statusBadge = '<span class="badge-status status-pending"><i class="far fa-clock"></i> Pending</span>';
            }

            const iconClass = typeIconMap[log.medicine_type] || 'fa-pills text-primary';

            return `
                <div class="dose-item-card ${isTaken ? 'is-taken' : isMissed ? 'is-missed' : 'is-pending'}">
                    <div class="row align-items-center g-3">
                        <div class="col-12 col-md-5 d-flex align-items-center gap-3">
                            <div class="avatar-icon bg-light rounded-3 p-3 text-center" style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${iconClass} fa-lg"></i>
                            </div>
                            <div>
                                <h6 class="fw-bold mb-1 text-dark">${App.escapeHtml(log.medicine_name)}</h6>
                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                    <span class="badge-type">${App.escapeHtml(log.medicine_type || 'Medicine')}</span>
                                    <span class="text-muted small fw-medium">${App.escapeHtml(log.dosage)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-6 col-md-3">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <i class="far fa-clock text-primary"></i>
                                <span class="fw-bold text-dark">${StorageManager.formatTimeForDisplay(log.scheduled_time)}</span>
                            </div>
                            <div class="text-muted small">
                                <i class="fas fa-utensils me-1"></i> ${App.escapeHtml(log.instructions)}
                            </div>
                        </div>

                        <div class="col-6 col-md-2 text-md-center">
                            ${statusBadge}
                        </div>

                        <div class="col-12 col-md-2 text-md-end">
                            <div class="btn-group btn-group-sm w-100 w-md-auto shadow-sm" role="group">
                                <button type="button" class="btn ${isTaken ? 'btn-success' : 'btn-outline-success'}" title="Mark as Taken" onclick="Dashboard.handleDoseAction('${log.id}', 'Taken')">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button type="button" class="btn ${isMissed ? 'btn-danger' : 'btn-outline-danger'}" title="Mark as Missed" onclick="Dashboard.handleDoseAction('${log.id}', 'Missed')">
                                    <i class="fas fa-xmark"></i>
                                </button>
                                <button type="button" class="btn ${isPending ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}" title="Keep as Pending" onclick="Dashboard.handleDoseAction('${log.id}', 'Pending')">
                                    <i class="far fa-clock"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    handleDoseAction(logId, status) {
        StorageManager.updateLogStatus(logId, status);
        App.showToast(`Dose marked as ${status}`, status === 'Taken' ? 'success' : status === 'Missed' ? 'danger' : 'info');
        this.loadDashboard();
        App.updateNavBadges();
    },

    // ---------------------------------------------
    // Render Upcoming Reminders Widget
    // ---------------------------------------------
    renderUpcomingReminders() {
        const container = document.getElementById('upcoming-reminders-list');
        const emptyState = document.getElementById('upcoming-reminders-empty');
        if (!container) return;

        const upcoming = StorageManager.getUpcomingReminders();

        if (upcoming.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = upcoming.map(item => `
            <div class="d-flex align-items-center justify-content-between p-3 mb-2 bg-light rounded-3 border">
                <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-primary-subtle text-primary rounded-circle" style="width: 40px; height: 40px;">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div>
                        <div class="fw-bold text-dark">${App.escapeHtml(item.medicine_name)}</div>
                        <div class="small text-muted">${App.escapeHtml(item.dosage)} &bull; ${App.escapeHtml(item.instructions)}</div>
                    </div>
                </div>
                <div class="text-end">
                    <span class="time-pill bg-white shadow-sm border">
                        <i class="far fa-clock text-primary"></i> ${StorageManager.formatTimeForDisplay(item.scheduled_time)}
                    </span>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

window.Dashboard = Dashboard;
