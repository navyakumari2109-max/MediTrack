/**
 * MediTrack - Settings & System Configuration
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const SettingsPage = {
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updatePermissionStatus();
    },

    loadSettings() {
        const settings = StorageManager.getSettings();
        const profile = StorageManager.getUserProfile();

        const soundToggle = document.getElementById('setting-sound-toggle');
        const lowStockInput = document.getElementById('setting-low-stock-threshold');

        if (soundToggle) soundToggle.checked = !!settings.soundEnabled;
        if (lowStockInput) lowStockInput.value = settings.lowStockThreshold || 5;

        // Populate User Health & Weight Profile
        const weightInput = document.getElementById('setting-user-weight');
        const targetWeightInput = document.getElementById('setting-target-weight');
        const unitSelect = document.getElementById('setting-weight-unit');

        if (weightInput) weightInput.value = (profile.current_weight !== null && profile.current_weight !== undefined) ? profile.current_weight : '';
        if (targetWeightInput) targetWeightInput.value = (profile.target_weight !== null && profile.target_weight !== undefined) ? profile.target_weight : '';
        if (unitSelect) unitSelect.value = profile.weight_unit || 'kg';

        // Display storage metrics
        this.renderStorageMetrics();
    },

    setupEventListeners() {
        // Save User Health Profile
        const saveProfileBtn = document.getElementById('btn-save-health-profile');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const weight = parseFloat(document.getElementById('setting-user-weight').value);
                const target = parseFloat(document.getElementById('setting-target-weight').value);
                const unit = document.getElementById('setting-weight-unit').value;

                if (isNaN(weight) || weight <= 0) {
                    App.showToast('Please enter a valid weight number.', 'warning');
                    return;
                }

                StorageManager.logUserWeight(weight, unit, 'Updated from Settings');
                StorageManager.saveUserProfile({
                    current_weight: weight,
                    target_weight: isNaN(target) ? null : target,
                    weight_unit: unit
                });

                App.showToast('User health profile & weight updated!', 'success');
                this.renderStorageMetrics();
            });
        }
        // Sound toggle
        const soundToggle = document.getElementById('setting-sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                const settings = StorageManager.getSettings();
                settings.soundEnabled = e.target.checked;
                StorageManager.saveSettings(settings);
                App.showToast(`Sound alerts ${e.target.checked ? 'enabled' : 'disabled'}.`, 'info');
                if (e.target.checked) App.playAlertChime();
            });
        }

        // Low stock threshold
        const lowStockInput = document.getElementById('setting-low-stock-threshold');
        if (lowStockInput) {
            lowStockInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                    const settings = StorageManager.getSettings();
                    settings.lowStockThreshold = val;
                    StorageManager.saveSettings(settings);
                    App.showToast(`Low stock warning set to ${val} units.`, 'success');
                    App.updateNavBadges();
                }
            });
        }

        // Notification permission button
        const notifBtn = document.getElementById('btn-request-notif');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                this.requestNotificationPermission();
            });
        }

        // Test audio chime
        const testSoundBtn = document.getElementById('btn-test-chime');
        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                App.playAlertChime();
                App.showToast('Playing MediTrack alert chime...', 'info');
            });
        }

        // Clear all data
        const clearBtn = document.getElementById('btn-clear-all-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.confirmClearAllData();
            });
        }
    },

    updatePermissionStatus() {
        const badge = document.getElementById('setting-notif-status');
        const btn = document.getElementById('btn-request-notif');
        if (!badge) return;

        if (!('Notification' in window)) {
            badge.className = 'badge bg-secondary p-2';
            badge.textContent = 'Not Supported';
            if (btn) btn.disabled = true;
            return;
        }

        if (Notification.permission === 'granted') {
            badge.className = 'badge bg-success p-2';
            badge.innerHTML = '<i class="fas fa-check-circle me-1"></i> Granted';
            if (btn) {
                btn.textContent = 'Permission Granted';
                btn.className = 'btn btn-sm btn-outline-success rounded-pill px-3';
                btn.disabled = true;
            }
        } else if (Notification.permission === 'denied') {
            badge.className = 'badge bg-danger p-2';
            badge.innerHTML = '<i class="fas fa-times-circle me-1"></i> Denied (Blocked)';
            if (btn) {
                btn.textContent = 'Blocked in Browser';
                btn.className = 'btn btn-sm btn-outline-danger rounded-pill px-3';
                btn.disabled = true;
            }
        } else {
            badge.className = 'badge bg-warning text-dark p-2';
            badge.innerHTML = '<i class="far fa-bell me-1"></i> Not Requested';
            if (btn) {
                btn.textContent = 'Enable Notifications';
                btn.className = 'btn btn-sm btn-primary rounded-pill px-3';
                btn.disabled = false;
            }
        }
    },

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            App.showToast('Browser notifications unsupported.', 'warning');
            return;
        }

        Notification.requestPermission().then(() => {
            this.updatePermissionStatus();
            if (Notification.permission === 'granted') {
                App.showToast('Desktop notifications successfully enabled!', 'success');
            }
        });
    },

    renderStorageMetrics() {
        const medCountEl = document.getElementById('metric-total-meds');
        const logCountEl = document.getElementById('metric-total-logs');
        const sizeEl = document.getElementById('metric-storage-size');

        const meds = StorageManager.getMedicines();
        const logs = StorageManager.getLogs();

        if (medCountEl) medCountEl.textContent = `${meds.length} saved`;
        if (logCountEl) logCountEl.textContent = `${logs.length} logged`;

        // Calculate localStorage usage in KB
        if (sizeEl) {
            let totalBytes = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalBytes += (localStorage[key].length + key.length) * 2;
                }
            }
            const kb = (totalBytes / 1024).toFixed(2);
            sizeEl.textContent = `${kb} KB used`;
        }
    },

    confirmClearAllData() {
        const modalId = 'clear-all-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.65);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-danger text-white py-3">
                            <h5 class="modal-title fw-bold"><i class="fas fa-triangle-exclamation me-2"></i> Danger: Reset All Application Data</h5>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="avatar-icon-lg bg-danger-subtle text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 64px; height: 64px;">
                                <i class="fas fa-trash-can fa-2x"></i>
                            </div>
                            <h5 class="fw-bold mb-2">Are you completely sure?</h5>
                            <p class="text-muted small mb-0">This will wipe all medicines, reminders, dosage logs, and custom settings from your browser's Local Storage. This action is irreversible.</p>
                        </div>
                        <div class="modal-footer bg-light p-3 justify-content-center gap-2">
                            <button type="button" class="btn btn-outline-secondary px-4 rounded-pill" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                            <button type="button" class="btn btn-danger px-4 rounded-pill fw-semibold" onclick="SettingsPage.executeClearAll('${modalId}')">
                                <i class="fas fa-trash-can me-1"></i> Yes, Wipe Everything
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    executeClearAll(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        StorageManager.clearAllData();
        App.showToast('All MediTrack data wiped.', 'info');
        this.renderStorageMetrics();
        App.updateNavBadges();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SettingsPage.init();
});

window.SettingsPage = SettingsPage;
