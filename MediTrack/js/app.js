/**
 * MediTrack - Global App Engine & Real-Time Reminder Monitor
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const App = {
    audioCtx: null,
    reminderInterval: null,
    activeAlertModal: null,
    deferredPrompt: null,

    init() {
        this.updateHeaderTime();
        setInterval(() => this.updateHeaderTime(), 1000);

        this.setupNavigation();
        this.setupReminderWatcher();
        this.updateNavBadges();
        this.registerServiceWorker();
        this.setupPwaInstallPrompt();

        // Check if first-time visit: if completely empty, let user know or offer sample data
        const medicines = StorageManager.getMedicines();
        if (medicines.length === 0 && !localStorage.getItem('meditrack_visited')) {
            localStorage.setItem('meditrack_visited', 'true');
        }

        // Initialize tooltips/popovers if bootstrap available
        if (window.bootstrap) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
        }
    },

    // ---------------------------------------------
    // Progressive Web App (PWA) Mobile Install Engine
    // ---------------------------------------------
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        console.log('MediTrack PWA Service Worker registered:', reg.scope);
                    })
                    .catch(err => {
                        console.warn('Service Worker registration skipped/failed:', err);
                    });
            });
        }
    },

    isAppInstalled() {
        return localStorage.getItem('meditrack_app_installed') === 'true' ||
               window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    },

    hideInstallUI() {
        const installBtns = document.querySelectorAll('.btn-install-pwa');
        installBtns.forEach(btn => btn.style.setProperty('display', 'none', 'important'));
        const installBanner = document.getElementById('mobile-install-banner');
        if (installBanner) installBanner.style.setProperty('display', 'none', 'important');
        const settingsCard = document.getElementById('settings-install-card');
        if (settingsCard) settingsCard.style.setProperty('display', 'none', 'important');
    },

    setupPwaInstallPrompt() {
        // If already installed, hide all install prompts immediately
        if (this.isAppInstalled()) {
            this.hideInstallUI();
            return;
        }

        // Listen for beforeinstallprompt event (Chrome, Edge, Android)
        window.addEventListener('beforeinstallprompt', (e) => {
            if (this.isAppInstalled()) {
                this.hideInstallUI();
                return;
            }
            e.preventDefault();
            this.deferredPrompt = e;

            // Show install buttons
            const installBtns = document.querySelectorAll('.btn-install-pwa');
            installBtns.forEach(btn => btn.style.display = 'inline-flex');

            const installBanner = document.getElementById('mobile-install-banner');
            if (installBanner) installBanner.style.display = 'block';
        });

        // Detect if app was installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            localStorage.setItem('meditrack_app_installed', 'true');
            this.hideInstallUI();
            this.showToast('MediTrack installed successfully!', 'success');
        });

        // Hide install buttons if already in standalone app mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            localStorage.setItem('meditrack_app_installed', 'true');
            this.hideInstallUI();
        }
    },

    installPwa() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the MediTrack PWA installation');
                    localStorage.setItem('meditrack_app_installed', 'true');
                    this.hideInstallUI();
                } else {
                    console.log('User dismissed the MediTrack PWA installation');
                }
                this.deferredPrompt = null;
            });
        } else {
            // Check if iOS Safari
            const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIos) {
                this.showIosInstallModal();
            } else {
                this.showGenericInstallModal();
            }
        }
    },

    showIosInstallModal() {
        const modalId = 'ios-install-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-primary text-white py-3">
                            <h6 class="modal-title fw-bold mb-0"><i class="fab fa-apple me-2"></i> Install MediTrack on iPhone / iPad</h6>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <img src="assets/icons/icon-192.png" width="72" height="72" class="rounded-4 mb-3 shadow-sm" alt="MediTrack">
                            <h5 class="fw-bold mb-2">Add MediTrack to Home Screen</h5>
                            <p class="text-muted small mb-3">Install MediTrack as a native app on iOS Safari:</p>
                            <div class="bg-light p-3 rounded-3 text-start small mb-3">
                                <div class="mb-2"><strong>Step 1:</strong> Tap the <i class="fas fa-arrow-up-from-bracket text-primary"></i> <strong>Share</strong> button in Safari's bottom toolbar.</div>
                                <div><strong>Step 2:</strong> Scroll down and select <i class="fas fa-plus-square text-primary"></i> <strong>Add to Home Screen</strong>.</div>
                            </div>
                            <button type="button" class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('${modalId}').remove()">Got it</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    showGenericInstallModal() {
        const modalId = 'generic-install-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-primary text-white py-3">
                            <h6 class="modal-title fw-bold mb-0"><i class="fas fa-mobile-screen me-2"></i> Install MediTrack Mobile App</h6>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <img src="assets/icons/icon-192.png" width="72" height="72" class="rounded-4 mb-3 shadow-sm" alt="MediTrack">
                            <h5 class="fw-bold mb-2">Install MediTrack on Your Device</h5>
                            <p class="text-muted small mb-3">Run MediTrack as an offline-capable mobile application on Android, iPhone, Windows, or Mac:</p>
                            <div class="bg-light p-3 rounded-3 text-start small mb-3">
                                <div class="mb-2"><i class="fas fa-check text-success me-2"></i> <strong>Chrome / Edge / Android:</strong> Tap browser menu (3 dots) &rarr; Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</div>
                                <div><i class="fas fa-check text-success me-2"></i> <strong>iPhone / Safari:</strong> Tap Share <i class="fas fa-arrow-up-from-bracket"></i> &rarr; Select <strong>Add to Home Screen</strong>.</div>
                            </div>
                            <button type="button" class="btn btn-primary rounded-pill px-4" onclick="document.getElementById('${modalId}').remove()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    // ---------------------------------------------
    // Live Header Clock & Date
    // ---------------------------------------------
    updateHeaderTime() {
        const timeEl = document.getElementById('header-live-time');
        const dateEl = document.getElementById('header-live-date');
        const now = new Date();

        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        if (dateEl) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    },

    // ---------------------------------------------
    // Responsive Navigation & Active State
    // ---------------------------------------------
    setupNavigation() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('app-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay && sidebar) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }

        // Highlight active page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link-custom');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Also highlight mobile bottom nav
        const bottomNavLinks = document.querySelectorAll('.bottom-nav-item');
        bottomNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    updateNavBadges() {
        const stats = StorageManager.getDashboardStats();
        const pendingBadge = document.getElementById('nav-pending-badge');
        const lowStockBadge = document.getElementById('nav-stock-badge');
        const mobilePendingBadge = document.getElementById('bottom-pending-badge');

        if (pendingBadge) {
            if (stats.pendingDoses > 0) {
                pendingBadge.textContent = stats.pendingDoses;
                pendingBadge.style.display = 'inline-block';
            } else {
                pendingBadge.style.display = 'none';
            }
        }

        if (mobilePendingBadge) {
            if (stats.pendingDoses > 0) {
                mobilePendingBadge.textContent = stats.pendingDoses;
                mobilePendingBadge.style.display = 'inline-block';
            } else {
                mobilePendingBadge.style.display = 'none';
            }
        }

        if (lowStockBadge) {
            if (stats.lowStockMedicines.length > 0) {
                lowStockBadge.textContent = stats.lowStockMedicines.length;
                lowStockBadge.style.display = 'inline-block';
            } else {
                lowStockBadge.style.display = 'none';
            }
        }
    },

    // ---------------------------------------------
    // Sound Generator (Pure Web Audio API - no external file needed)
    // ---------------------------------------------
    playAlertChime() {
        const settings = StorageManager.getSettings();
        if (!settings.soundEnabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!this.audioCtx) {
                this.audioCtx = new AudioContext();
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const now = this.audioCtx.currentTime;
            
            // Medical chime sequence: Two soft melodic chimes (E5 -> G#5)
            const osc1 = this.audioCtx.createOscillator();
            const gain1 = this.audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, now); // E5
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc1.connect(gain1);
            gain1.connect(this.audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.5);

            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(830.61, now + 0.25); // G#5
            gain2.gain.setValueAtTime(0, now + 0.25);
            gain2.gain.linearRampToValueAtTime(0.3, now + 0.3);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start(now + 0.25);
            osc2.stop(now + 0.9);
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    },

    // ---------------------------------------------
    // Real-Time Reminder Watcher
    // ---------------------------------------------
    setupReminderWatcher() {
        // Run check immediately on load
        this.checkScheduledReminders();

        // Run check every 10 seconds
        if (this.reminderInterval) clearInterval(this.reminderInterval);
        this.reminderInterval = setInterval(() => {
            this.checkScheduledReminders();
        }, 10000);
    },

    checkScheduledReminders() {
        const today = StorageManager.getTodayDateString();
        const currentTime = StorageManager.getCurrentTimeString();
        const logs = StorageManager.ensureTodayLogs();

        // 1. Medicine Dose Reminders
        logs.forEach(log => {
            if (log.status === 'Pending') {
                if (log.scheduled_time === currentTime) {
                    const alertKey = `alert_${log.id}_${today}_${currentTime}`;

                    if (!StorageManager.hasAlertBeenTriggered(alertKey)) {
                        StorageManager.markAlertAsTriggered(alertKey);
                        this.triggerReminderAlert(log);
                    }
                }
            }
        });

        // 2. Weekly Checkup Reminders
        const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = daysOrder[new Date().getDay()];
        const checkups = StorageManager.getWeeklyCheckups();

        checkups.forEach(checkup => {
            if (checkup.enabled && checkup.day_of_week === currentDayName && checkup.time === currentTime) {
                const checkupKey = `alert_checkup_${checkup.id}_${today}_${currentTime}`;
                if (!StorageManager.hasAlertBeenTriggered(checkupKey)) {
                    StorageManager.markAlertAsTriggered(checkupKey);
                    this.triggerCheckupAlert(checkup);
                }
            }
        });
    },

    triggerCheckupAlert(checkup) {
        this.playAlertChime();

        if (Notification.permission === 'granted') {
            try {
                const notif = new Notification(`MediTrack Weekly Checkup: ${checkup.title}`, {
                    body: `Scheduled appointment with ${checkup.doctor_name} at ${checkup.location}.`,
                    icon: 'assets/icons/icon-192.png',
                    tag: checkup.id,
                    requireInteraction: true
                });
                notif.onclick = () => {
                    window.focus();
                    notif.close();
                };
            } catch (e) {
                console.warn(e);
            }
        }

        this.showInAppCheckupModal(checkup);
    },

    showInAppCheckupModal(checkup) {
        const existing = document.getElementById('active-checkup-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade show" id="active-checkup-modal" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                        <div class="modal-header bg-info text-white py-3 px-4">
                            <div class="d-flex align-items-center gap-2">
                                <i class="fas fa-stethoscope fa-lg"></i>
                                <h5 class="modal-title fw-bold mb-0">Weekly Medical Checkup Alert</h5>
                            </div>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="avatar-icon-lg bg-info-subtle text-info rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
                                <i class="fas fa-user-doctor fa-2x"></i>
                            </div>
                            <h4 class="fw-bold text-dark mb-1">${this.escapeHtml(checkup.title)}</h4>
                            <p class="text-muted fw-semibold mb-3"><i class="fas fa-user-md text-primary me-1"></i> ${this.escapeHtml(checkup.doctor_name)}</p>
                            
                            <div class="bg-light p-3 rounded-3 mb-3 text-start small">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted"><i class="far fa-calendar me-1"></i> Scheduled:</span>
                                    <span class="fw-bold text-dark">Every ${this.escapeHtml(checkup.day_of_week)} at ${StorageManager.formatTimeForDisplay(checkup.time)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted"><i class="fas fa-location-dot me-1"></i> Location:</span>
                                    <span class="fw-semibold text-dark">${this.escapeHtml(checkup.location || 'Local Clinic')}</span>
                                </div>
                                ${checkup.notes ? `
                                <div class="mt-2 text-muted fst-italic">
                                    <i class="far fa-note-sticky me-1"></i> "${this.escapeHtml(checkup.notes)}"
                                </div>
                                ` : ''}
                            </div>
                            
                            <p class="text-muted small mb-0">Regular clinical monitoring helps maintain optimum therapeutic outcomes.</p>
                        </div>
                        <div class="modal-footer bg-light p-3 d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary px-3 py-2 fw-semibold rounded-pill" onclick="document.getElementById('active-checkup-modal').remove()">
                                Remind Later
                            </button>
                            <button type="button" class="btn btn-success px-4 py-2 fw-semibold rounded-pill shadow-sm" onclick="App.handleCheckupCompleted('${checkup.id}')">
                                <i class="fas fa-check-circle me-1"></i> Mark Attended
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleCheckupCompleted(id) {
        StorageManager.markCheckupCompleted(id);
        const modal = document.getElementById('active-checkup-modal');
        if (modal) modal.remove();
        this.showToast('Weekly checkup marked as attended!', 'success');
        if (window.Dashboard && typeof window.Dashboard.loadDashboard === 'function') {
            window.Dashboard.loadDashboard();
        }
        if (window.RemindersPage && typeof window.RemindersPage.renderReminders === 'function') {
            window.RemindersPage.renderReminders();
        }
    },

    triggerReminderAlert(log) {
        // 1. Play sound
        this.playAlertChime();

        // 2. Trigger browser notification if permitted
        if (Notification.permission === 'granted') {
            try {
                const notif = new Notification(`MediTrack Medicine Alert: ${log.medicine_name}`, {
                    body: `Time for your dose: ${log.dosage} (${log.instructions}). Please take your medicine.`,
                    icon: 'assets/icons/pill-icon.png',
                    tag: log.id,
                    requireInteraction: true
                });
                notif.onclick = () => {
                    window.focus();
                    notif.close();
                };
            } catch (e) {
                console.warn('Browser notification error:', e);
            }
        }

        // 3. Display interactive In-App Reminder Modal
        this.showInAppReminderModal(log);
    },

    showInAppReminderModal(log) {
        // Remove existing alert modal if any
        const existing = document.getElementById('active-dose-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade show" id="active-dose-modal" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                        <div class="modal-header bg-primary text-white py-3 px-4">
                            <div class="d-flex align-items-center gap-2">
                                <i class="fas fa-bell fa-shake fa-lg text-warning"></i>
                                <h5 class="modal-title fw-bold mb-0">Scheduled Medicine Alert</h5>
                            </div>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="avatar-icon-lg bg-primary-subtle text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
                                <i class="fas fa-pills fa-2x"></i>
                            </div>
                            <h4 class="fw-bold text-dark mb-1">${this.escapeHtml(log.medicine_name)}</h4>
                            <p class="text-primary fw-semibold fs-5 mb-2">${this.escapeHtml(log.dosage)}</p>
                            
                            <div class="bg-light p-3 rounded-3 mb-3 text-start">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted"><i class="far fa-clock me-1"></i> Scheduled Time:</span>
                                    <span class="fw-bold text-dark">${StorageManager.formatTimeForDisplay(log.scheduled_time)}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted"><i class="fas fa-utensils me-1"></i> Instructions:</span>
                                    <span class="fw-semibold text-dark">${this.escapeHtml(log.instructions)}</span>
                                </div>
                            </div>
                            
                            <p class="text-muted small mb-0">Please take your medicine as prescribed by your doctor.</p>
                        </div>
                        <div class="modal-footer bg-light p-3 d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-outline-danger px-3 py-2 fw-semibold rounded-pill" onclick="App.handleAlertAction('${log.id}', 'Missed')">
                                <i class="fas fa-times-circle me-1"></i> Mark as Missed
                            </button>
                            <button type="button" class="btn btn-outline-secondary px-3 py-2 fw-semibold rounded-pill" onclick="App.closeAlertModal()">
                                <i class="far fa-clock me-1"></i> Remind Later
                            </button>
                            <button type="button" class="btn btn-success px-4 py-2 fw-semibold rounded-pill shadow-sm" onclick="App.handleAlertAction('${log.id}', 'Taken')">
                                <i class="fas fa-check-circle me-1"></i> Mark as Taken
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    closeAlertModal() {
        const modal = document.getElementById('active-dose-modal');
        if (modal) modal.remove();
    },

    handleAlertAction(logId, status) {
        StorageManager.updateLogStatus(logId, status);
        this.closeAlertModal();
        this.showToast(`Dose marked as ${status}!`, status === 'Taken' ? 'success' : 'warning');
        this.updateNavBadges();

        // Refresh current page data if relevant handlers exist
        if (window.Dashboard && typeof window.Dashboard.loadDashboard === 'function') {
            window.Dashboard.loadDashboard();
        }
        if (window.RemindersPage && typeof window.RemindersPage.renderReminders === 'function') {
            window.RemindersPage.renderReminders();
        }
        if (window.HistoryPage && typeof window.HistoryPage.renderHistory === 'function') {
            window.HistoryPage.renderHistory();
        }
    },

    // ---------------------------------------------
    // Toast Notification System
    // ---------------------------------------------
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-check-circle text-success',
            warning: 'fa-exclamation-triangle text-warning',
            danger: 'fa-circle-xmark text-danger',
            info: 'fa-info-circle text-primary'
        };

        const toastId = 'toast_' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center border-0 shadow-lg mb-2 rounded-3" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex align-items-center p-3">
                    <i class="fas ${icons[type] || icons.info} fa-lg me-3"></i>
                    <div class="toast-body p-0 text-dark fw-medium flex-grow-1">
                        ${this.escapeHtml(message)}
                    </div>
                    <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        if (window.bootstrap) {
            const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
            bsToast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        } else {
            setTimeout(() => toastEl.remove(), 4000);
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
