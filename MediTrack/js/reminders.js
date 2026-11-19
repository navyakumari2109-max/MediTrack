/**
 * MediTrack - Reminders Engine & Schedule View
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const RemindersPage = {
    init() {
        this.renderPermissionStatus();
        this.renderReminders();
        this.renderWeeklyCheckups();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const reqBtn = document.getElementById('btn-request-permission');
        if (reqBtn) {
            reqBtn.addEventListener('click', () => {
                this.requestNotificationPermission();
            });
        }

        const testBtn = document.getElementById('btn-test-notification');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.triggerTestAlert();
            });
        }

        const addCheckupBtn = document.getElementById('btn-add-weekly-checkup');
        if (addCheckupBtn) {
            addCheckupBtn.addEventListener('click', () => {
                this.openAddCheckupModal();
            });
        }
    },

    renderPermissionStatus() {
        const badgeEl = document.getElementById('notification-permission-badge');
        const descEl = document.getElementById('notification-permission-desc');
        const reqBtn = document.getElementById('btn-request-permission');

        if (!('Notification' in window)) {
            if (badgeEl) {
                badgeEl.className = 'badge bg-secondary p-2';
                badgeEl.textContent = 'Unsupported by Browser';
            }
            if (descEl) descEl.textContent = 'This browser does not support HTML5 desktop notifications. In-app alerts will still be shown.';
            if (reqBtn) reqBtn.disabled = true;
            return;
        }

        const permission = Notification.permission;

        if (badgeEl) {
            if (permission === 'granted') {
                badgeEl.className = 'badge bg-success p-2';
                badgeEl.innerHTML = '<i class="fas fa-check-circle me-1"></i> Notifications Enabled';
                if (descEl) descEl.textContent = 'Browser notifications are active. You will receive system alerts when doses are scheduled.';
                if (reqBtn) {
                    reqBtn.textContent = 'Permission Granted';
                    reqBtn.className = 'btn btn-sm btn-outline-success rounded-pill px-3';
                    reqBtn.disabled = true;
                }
            } else if (permission === 'denied') {
                badgeEl.className = 'badge bg-danger p-2';
                badgeEl.innerHTML = '<i class="fas fa-ban me-1"></i> Notifications Blocked';
                if (descEl) descEl.textContent = 'Notifications have been blocked in your browser settings. Please click the padlock or settings icon in your address bar to re-enable.';
                if (reqBtn) {
                    reqBtn.textContent = 'Blocked by Browser';
                    reqBtn.className = 'btn btn-sm btn-outline-danger rounded-pill px-3';
                    reqBtn.disabled = true;
                }
            } else {
                badgeEl.className = 'badge bg-warning text-dark p-2';
                badgeEl.innerHTML = '<i class="fas fa-bell-slash me-1"></i> Permission Needed';
                if (descEl) descEl.textContent = 'Desktop notification permission has not yet been granted. Click the button to allow notifications.';
                if (reqBtn) {
                    reqBtn.textContent = 'Enable Notifications';
                    reqBtn.className = 'btn btn-sm btn-primary rounded-pill px-3';
                    reqBtn.disabled = false;
                }
            }
        }
    },

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            App.showToast('Your browser does not support desktop notifications.', 'warning');
            return;
        }

        Notification.requestPermission().then(permission => {
            this.renderPermissionStatus();
            if (permission === 'granted') {
                App.showToast('Notification permission granted!', 'success');
                // Save in settings
                const settings = StorageManager.getSettings();
                settings.notificationsEnabled = true;
                StorageManager.saveSettings(settings);
            } else if (permission === 'denied') {
                App.showToast('Notification permission was denied.', 'danger');
            }
        });
    },

    triggerTestAlert() {
        App.playAlertChime();

        if (Notification.permission === 'granted') {
            try {
                new Notification('MediTrack Demo Test Alert', {
                    body: 'This is a test notification from MediTrack! Alerts will notify you when it is time to take your medicine.',
                    icon: 'assets/icons/pill-icon.png'
                });
            } catch (e) {
                console.warn(e);
            }
        }

        // Also display test in-app modal
        App.showInAppReminderModal({
            id: 'test_demo_log',
            medicine_name: 'Test Medicine (Demo Dose)',
            dosage: '1 Tablet',
            scheduled_time: StorageManager.getCurrentTimeString(),
            instructions: 'After meal'
        });

        App.showToast('Test alert triggered!', 'info');
    },

    renderReminders() {
        const todayContainer = document.getElementById('today-reminders-list');
        const allScheduleContainer = document.getElementById('all-medicines-reminders-list');
        const emptyToday = document.getElementById('reminders-today-empty');
        const emptyAll = document.getElementById('reminders-all-empty');

        const todayLogs = StorageManager.ensureTodayLogs();
        const currentTime = StorageManager.getCurrentTimeString();

        // 1. Render today's remaining & upcoming reminders
        if (todayContainer) {
            const pendingToday = todayLogs.filter(l => l.status === 'Pending');

            if (pendingToday.length === 0) {
                todayContainer.innerHTML = '';
                if (emptyToday) emptyToday.style.display = 'block';
            } else {
                if (emptyToday) emptyToday.style.display = 'none';

                todayContainer.innerHTML = pendingToday.map(dose => {
                    const isPast = dose.scheduled_time < currentTime;
                    return `
                        <div class="p-3 mb-2 rounded-3 border bg-white shadow-sm d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center gap-3">
                                <div class="avatar-icon bg-primary-subtle text-primary rounded-circle" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                                    <i class="far fa-clock fa-lg"></i>
                                </div>
                                <div>
                                    <h6 class="fw-bold mb-0 text-dark">${App.escapeHtml(dose.medicine_name)}</h6>
                                    <span class="small text-muted">${App.escapeHtml(dose.dosage)} &bull; ${App.escapeHtml(dose.instructions)}</span>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge ${isPast ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} px-3 py-2 rounded-pill fw-bold">
                                    <i class="far fa-clock me-1"></i> ${StorageManager.formatTimeForDisplay(dose.scheduled_time)}
                                </span>
                                <button type="button" class="btn btn-sm btn-success rounded-pill px-3" onclick="RemindersPage.takeDoseNow('${dose.id}')">
                                    <i class="fas fa-check me-1"></i> Take Now
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 2. Render all configured medicine reminder routines
        if (allScheduleContainer) {
            const medicines = StorageManager.getMedicines();

            if (medicines.length === 0) {
                allScheduleContainer.innerHTML = '';
                if (emptyAll) emptyAll.style.display = 'block';
            } else {
                if (emptyAll) emptyAll.style.display = 'none';

                allScheduleContainer.innerHTML = medicines.map(med => {
                    const times = (med.reminder_times || []).map(t => `
                        <span class="time-pill bg-light border">
                            <i class="far fa-clock text-primary"></i> ${StorageManager.formatTimeForDisplay(t)}
                        </span>
                    `).join(' ');

                    return `
                        <div class="p-3 mb-2 rounded-3 border bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div>
                                <h6 class="fw-bold mb-1 text-dark">${App.escapeHtml(med.medicine_name)}</h6>
                                <span class="small text-muted">${App.escapeHtml(med.dosage)} &bull; ${App.escapeHtml(med.frequency)} &bull; ${App.escapeHtml(med.instructions)}</span>
                            </div>
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                ${times}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    },

    takeDoseNow(logId) {
        StorageManager.updateLogStatus(logId, 'Taken');
        App.showToast('Medicine marked as Taken!', 'success');
        this.renderReminders();
        App.updateNavBadges();
    },

    // ---------------------------------------------
    // Weekly Checkup Reminders
    // ---------------------------------------------
    renderWeeklyCheckups() {
        const container = document.getElementById('weekly-checkups-list');
        const emptyState = document.getElementById('checkups-empty-state');
        if (!container) return;

        const checkups = StorageManager.getWeeklyCheckups();

        if (checkups.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = checkups.map(c => `
            <div class="p-3 mb-2 rounded-3 border bg-white shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-info-subtle text-info rounded-circle" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user-doctor fa-lg"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <h6 class="fw-bold mb-0 text-dark">${App.escapeHtml(c.title)}</h6>
                            <span class="badge bg-primary-subtle text-primary fw-semibold" style="font-size: 0.7rem;">Every ${App.escapeHtml(c.day_of_week)}</span>
                        </div>
                        <span class="small text-muted">
                            <i class="far fa-clock text-primary me-1"></i> ${StorageManager.formatTimeForDisplay(c.time)} &bull; 
                            <i class="fas fa-stethoscope me-1 text-info"></i> ${App.escapeHtml(c.doctor_name)} &bull; 
                            <i class="fas fa-location-dot me-1 text-danger"></i> ${App.escapeHtml(c.location || 'Local Clinic')}
                        </span>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="RemindersPage.markCheckupDone('${c.id}')">
                        <i class="fas fa-check me-1"></i> Mark Attended
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger rounded-circle" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;" onclick="RemindersPage.deleteCheckup('${c.id}')" title="Delete Checkup">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    openAddCheckupModal() {
        const modalId = 'add-checkup-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-info text-white py-3">
                            <h6 class="modal-title fw-bold mb-0"><i class="fas fa-stethoscope me-2"></i> Schedule Weekly Checkup Reminder</h6>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="mb-3">
                                <label class="form-label-custom small">Checkup Title <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-custom" id="chk-title" placeholder="e.g. Weekly Blood Pressure Check, Doctor Consultation" required>
                            </div>

                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label-custom small">Day of Week <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-custom" id="chk-day">
                                        <option value="Monday">Every Monday</option>
                                        <option value="Tuesday">Every Tuesday</option>
                                        <option value="Wednesday">Every Wednesday</option>
                                        <option value="Thursday">Every Thursday</option>
                                        <option value="Friday">Every Friday</option>
                                        <option value="Saturday" selected>Every Saturday</option>
                                        <option value="Sunday">Every Sunday</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label-custom small">Time <span class="text-danger">*</span></label>
                                    <input type="time" class="form-control form-control-custom" id="chk-time" value="10:00" required>
                                </div>
                            </div>

                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label-custom small">Doctor / Specialist</label>
                                    <input type="text" class="form-control form-control-custom" id="chk-doc" placeholder="e.g. Dr. Ramesh Sharma">
                                </div>
                                <div class="col-6">
                                    <label class="form-label-custom small">Clinic / Location</label>
                                    <input type="text" class="form-control form-control-custom" id="chk-loc" placeholder="e.g. City Care Hospital">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label-custom small">Optional Notes / Tests Needed</label>
                                <input type="text" class="form-control form-control-custom" id="chk-notes" placeholder="e.g. Fasting blood sugar, check BP record">
                            </div>

                            <div class="d-flex gap-2 justify-content-end pt-2 border-top">
                                <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                                <button type="button" class="btn btn-sm btn-primary rounded-pill px-4 shadow-sm fw-semibold" onclick="RemindersPage.handleSaveCheckup('${modalId}')">
                                    Save Checkup Reminder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    handleSaveCheckup(modalId) {
        const title = document.getElementById('chk-title').value.trim();
        const day = document.getElementById('chk-day').value;
        const time = document.getElementById('chk-time').value;
        const doc = document.getElementById('chk-doc').value;
        const loc = document.getElementById('chk-loc').value;
        const notes = document.getElementById('chk-notes').value;

        if (!title) {
            App.showToast('Please enter a checkup title.', 'warning');
            return;
        }

        StorageManager.saveWeeklyCheckup({
            title,
            day_of_week: day,
            time,
            doctor_name: doc,
            location: loc,
            notes,
            enabled: true
        });

        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        App.showToast('Weekly checkup reminder saved!', 'success');
        this.renderWeeklyCheckups();
    },

    deleteCheckup(id) {
        if (!confirm('Are you sure you want to remove this weekly checkup reminder?')) return;
        StorageManager.deleteWeeklyCheckup(id);
        App.showToast('Checkup reminder removed.', 'info');
        this.renderWeeklyCheckups();
    },

    markCheckupDone(id) {
        StorageManager.markCheckupCompleted(id);
        App.showToast('Weekly checkup marked as attended!', 'success');
        this.renderWeeklyCheckups();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RemindersPage.init();
});

window.RemindersPage = RemindersPage;
