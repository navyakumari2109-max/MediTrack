/**
 * MediTrack - Local Storage & Data Management Layer
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const STORAGE_KEYS = {
    MEDICINES: 'meditrack_medicines',
    LOGS: 'meditrack_logs',
    SETTINGS: 'meditrack_settings',
    TRIGGERED_ALERTS: 'meditrack_triggered_alerts',
    USER_PROFILE: 'meditrack_user_profile',
    WEIGHT_LOGS: 'meditrack_weight_logs',
    CHECKUPS: 'meditrack_weekly_checkups'
};

const DEFAULT_SETTINGS = {
    notificationsEnabled: false,
    soundEnabled: true,
    lowStockThreshold: 5,
    autoMissedThresholdMinutes: 120 // Mark pending as missed after 2 hours if not taken
};

const DEFAULT_PROFILE = {
    current_weight: null,
    weight_unit: 'kg',
    target_weight: null,
    height: null,
    last_updated: null
};

const StorageManager = {
    // ---------------------------------------------
    // Helper utilities
    // ---------------------------------------------
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    },

    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getCurrentTimeString() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    formatDateForDisplay(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const date = new Date(parts[0], parts[1] - 1, parts[2]);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    },

    formatTimeForDisplay(time24) {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    },

    // ---------------------------------------------
    // Settings Operations
    // ---------------------------------------------
    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
        } catch (e) {
            console.error('Error loading settings:', e);
            return { ...DEFAULT_SETTINGS };
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    // ---------------------------------------------
    // Medicine CRUD Operations
    // ---------------------------------------------
    getMedicines() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.MEDICINES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error fetching medicines:', e);
            return [];
        }
    },

    getMedicineById(id) {
        const medicines = this.getMedicines();
        return medicines.find(m => m.id === id) || null;
    },

    saveMedicine(medicineData) {
        const medicines = this.getMedicines();
        let savedMed;

        if (medicineData.id) {
            // Update existing
            const index = medicines.findIndex(m => m.id === medicineData.id);
            if (index !== -1) {
                savedMed = {
                    ...medicines[index],
                    ...medicineData,
                    updated_at: new Date().toISOString()
                };
                medicines[index] = savedMed;
            } else {
                return null;
            }
        } else {
            // Create new
            savedMed = {
                id: this.generateId('med'),
                medicine_name: medicineData.medicine_name.trim(),
                dosage: medicineData.dosage.trim(),
                medicine_type: medicineData.medicine_type || 'Tablet',
                start_date: medicineData.start_date || this.getTodayDateString(),
                end_date: medicineData.end_date || '',
                frequency: medicineData.frequency || 'Once daily',
                reminder_times: Array.isArray(medicineData.reminder_times) ? medicineData.reminder_times : ['08:00'],
                instructions: medicineData.instructions || 'After food',
                notes: medicineData.notes ? medicineData.notes.trim() : '',
                remaining_quantity: parseInt(medicineData.remaining_quantity, 10) || 0,
                expiry_date: medicineData.expiry_date || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            medicines.push(savedMed);
        }

        try {
            localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
            // Automatically regenerate schedule for today
            this.ensureTodayLogs();
            return savedMed;
        } catch (e) {
            console.error('Error writing medicine to localStorage:', e);
            return null;
        }
    },

    deleteMedicine(id) {
        try {
            const medicines = this.getMedicines().filter(m => m.id !== id);
            localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));

            // Also remove future pending logs for this medicine
            const today = this.getTodayDateString();
            const logs = this.getLogs().filter(log => {
                if (log.medicine_id === id && log.scheduled_date >= today && log.status === 'Pending') {
                    return false;
                }
                return true;
            });
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
            return true;
        } catch (e) {
            console.error('Error deleting medicine:', e);
            return false;
        }
    },

    updateMedicineStock(medicineId, delta) {
        const medicines = this.getMedicines();
        const med = medicines.find(m => m.id === medicineId);
        if (med) {
            med.remaining_quantity = Math.max(0, (parseInt(med.remaining_quantity, 10) || 0) + delta);
            med.updated_at = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
            return med.remaining_quantity;
        }
        return null;
    },

    // ---------------------------------------------
    // Logs & Daily Schedule Operations
    // ---------------------------------------------
    getLogs() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.LOGS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error fetching logs:', e);
            return [];
        }
    },

    saveLogs(logs) {
        try {
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
            return true;
        } catch (e) {
            console.error('Error saving logs:', e);
            return false;
        }
    },

    ensureTodayLogs() {
        const today = this.getTodayDateString();
        const medicines = this.getMedicines();
        let logs = this.getLogs();
        let modified = false;

        medicines.forEach(med => {
            // Check if today falls in range: start_date <= today and (end_date is empty or >= today)
            const startDate = med.start_date || today;
            const endDate = med.end_date || '';

            const isStarted = today >= startDate;
            const isNotEnded = !endDate || today <= endDate;

            if (isStarted && isNotEnded && Array.isArray(med.reminder_times)) {
                med.reminder_times.forEach(time => {
                    const logId = `log_${med.id}_${today}_${time.replace(':', '')}`;
                    const existingIndex = logs.findIndex(l => l.id === logId);

                    if (existingIndex === -1) {
                        // Check if an entry with same med, date and time exists under any ID
                        const duplicateCheck = logs.find(l => 
                            l.medicine_id === med.id && 
                            l.scheduled_date === today && 
                            l.scheduled_time === time
                        );

                        if (!duplicateCheck) {
                            logs.push({
                                id: logId,
                                medicine_id: med.id,
                                medicine_name: med.medicine_name,
                                dosage: med.dosage,
                                medicine_type: med.medicine_type,
                                instructions: med.instructions,
                                scheduled_date: today,
                                scheduled_time: time,
                                status: 'Pending',
                                updated_at: new Date().toISOString()
                            });
                            modified = true;
                        }
                    }
                });
            }
        });

        if (modified) {
            // Sort logs by scheduled_time ascending
            logs.sort((a, b) => {
                if (a.scheduled_date === b.scheduled_date) {
                    return a.scheduled_time.localeCompare(b.scheduled_time);
                }
                return b.scheduled_date.localeCompare(a.scheduled_date);
            });
            this.saveLogs(logs);
        }

        return this.getTodayLogs();
    },

    getTodayLogs() {
        const today = this.getTodayDateString();
        const logs = this.getLogs();
        return logs.filter(l => l.scheduled_date === today)
                   .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    },

    updateLogStatus(logId, newStatus) {
        const logs = this.getLogs();
        const logIndex = logs.findIndex(l => l.id === logId);

        if (logIndex === -1) return false;

        const oldStatus = logs[logIndex].status;
        logs[logIndex].status = newStatus;
        logs[logIndex].updated_at = new Date().toISOString();

        // Handle inventory/stock deduction when marking as Taken
        const medicineId = logs[logIndex].medicine_id;
        if (newStatus === 'Taken' && oldStatus !== 'Taken') {
            this.updateMedicineStock(medicineId, -1);
        } else if (oldStatus === 'Taken' && newStatus !== 'Taken') {
            // Revert stock if changed back from Taken
            this.updateMedicineStock(medicineId, 1);
        }

        this.saveLogs(logs);
        return true;
    },

    // ---------------------------------------------
    // Dashboard Stats & Analytics
    // ---------------------------------------------
    getDashboardStats() {
        this.ensureTodayLogs();
        const todayLogs = this.getTodayLogs();
        const medicines = this.getMedicines();
        const settings = this.getSettings();

        const totalMedicines = medicines.length;
        const totalScheduledDoses = todayLogs.length;
        const completedDoses = todayLogs.filter(l => l.status === 'Taken').length;
        const missedDoses = todayLogs.filter(l => l.status === 'Missed').length;
        const pendingDoses = todayLogs.filter(l => l.status === 'Pending').length;

        // Low stock count
        const lowStockMedicines = medicines.filter(m => 
            parseInt(m.remaining_quantity, 10) <= settings.lowStockThreshold
        );

        // Expiring soon or expired count (within 30 days)
        const today = this.getTodayDateString();
        const expiringMedicines = medicines.filter(m => {
            if (!m.expiry_date) return false;
            const diffTime = new Date(m.expiry_date) - new Date(today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30; // Expired or expiring within 30 days
        });

        // Days completed and streak
        const daysStats = this.getDaysCompletedStats();
        // User profile & weight
        const userProfile = this.getUserProfile();
        // Next weekly checkup
        const nextCheckup = this.getNextWeeklyCheckup();

        return {
            totalMedicines,
            totalScheduledDoses,
            completedDoses,
            missedDoses,
            pendingDoses,
            lowStockMedicines,
            expiringMedicines,
            todayLogs,
            daysStats,
            userProfile,
            nextCheckup
        };
    },

    // ---------------------------------------------
    // Days Completed & Adherence Streak Engine
    // Streak is strictly counted after full completion of a day (all doses Taken)
    // ---------------------------------------------
    getDaysCompletedStats() {
        const logs = this.getLogs();
        
        // Group logs by scheduled_date
        const logsByDate = {};
        logs.forEach(log => {
            if (!log.scheduled_date) return;
            if (!logsByDate[log.scheduled_date]) {
                logsByDate[log.scheduled_date] = [];
            }
            logsByDate[log.scheduled_date].push(log);
        });

        // A day is completed ONLY if all scheduled doses for that day have status === 'Taken'
        const completedDates = new Set();
        Object.keys(logsByDate).forEach(dateStr => {
            const dayLogs = logsByDate[dateStr];
            if (dayLogs.length > 0 && dayLogs.every(l => l.status === 'Taken')) {
                completedDates.add(dateStr);
            }
        });

        const totalDaysCompleted = completedDates.size;

        const formatD = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const todayStr = this.getTodayDateString();
        let cur = new Date();
        let streak = 0;

        // If today is already fully completed (all doses taken), start streak from today.
        // Otherwise, today is still ongoing, so count streak backwards from yesterday.
        const isTodayCompleted = completedDates.has(todayStr);
        if (!isTodayCompleted) {
            cur.setDate(cur.getDate() - 1);
        }

        while (completedDates.has(formatD(cur))) {
            streak++;
            cur.setDate(cur.getDate() - 1);
        }

        return {
            totalDaysCompleted,
            streakDays: streak,
            isTodayCompleted
        };
    },

    getMedicineCourseProgress(med) {
        if (!med.start_date) return null;
        const today = this.getTodayDateString();
        const start = new Date(med.start_date);
        const now = new Date(today);

        const diffTime = now - start;
        const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

        if (med.end_date) {
            const end = new Date(med.end_date);
            const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
            const completedDay = Math.min(currentDay, totalDays);
            const percentage = Math.min(100, Math.round((completedDay / totalDays) * 100));
            const isCompleted = now > end;

            return {
                hasEndDate: true,
                currentDay: completedDay,
                totalDays,
                percentage,
                isCompleted,
                label: isCompleted ? `Course Completed (${totalDays} days)` : `Day ${completedDay} of ${totalDays} completed`
            };
        } else {
            return {
                hasEndDate: false,
                currentDay,
                label: `Active for ${currentDay} day${currentDay > 1 ? 's' : ''}`
            };
        }
    },

    // ---------------------------------------------
    // User Profile & Weight Tracking Layer
    // ---------------------------------------------
    getUserProfile() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
            return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : { ...DEFAULT_PROFILE };
        } catch (e) {
            return { ...DEFAULT_PROFILE };
        }
    },

    saveUserProfile(profile) {
        try {
            const current = this.getUserProfile();
            const updated = { ...current, ...profile, last_updated: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Error saving user profile:', e);
            return null;
        }
    },

    getWeightLogs() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    logUserWeight(weight, unit = 'kg', notes = '') {
        const logs = this.getWeightLogs();
        const parsedWeight = parseFloat(weight);
        if (isNaN(parsedWeight) || parsedWeight <= 0) return null;

        const newLog = {
            id: this.generateId('weight'),
            date: this.getTodayDateString(),
            weight: parsedWeight,
            unit: unit || 'kg',
            notes: notes ? notes.trim() : '',
            recorded_at: new Date().toISOString()
        };

        logs.unshift(newLog); // latest first
        try {
            localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));
            this.saveUserProfile({ current_weight: parsedWeight, weight_unit: unit });
            return newLog;
        } catch (e) {
            console.error('Error recording weight log:', e);
            return null;
        }
    },

    // ---------------------------------------------
    // Weekly Checkup Reminders Management
    // ---------------------------------------------
    getWeeklyCheckups() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CHECKUPS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveWeeklyCheckup(checkupData) {
        const checkups = this.getWeeklyCheckups();
        let saved;

        if (checkupData.id) {
            const idx = checkups.findIndex(c => c.id === checkupData.id);
            if (idx !== -1) {
                saved = {
                    ...checkups[idx],
                    ...checkupData,
                    updated_at: new Date().toISOString()
                };
                checkups[idx] = saved;
            } else {
                return null;
            }
        } else {
            saved = {
                id: this.generateId('checkup'),
                title: checkupData.title.trim(),
                day_of_week: checkupData.day_of_week || 'Monday',
                time: checkupData.time || '10:00',
                doctor_name: checkupData.doctor_name ? checkupData.doctor_name.trim() : 'General Physician',
                location: checkupData.location ? checkupData.location.trim() : 'Local Clinic / Telehealth',
                notes: checkupData.notes ? checkupData.notes.trim() : '',
                enabled: checkupData.enabled !== undefined ? checkupData.enabled : true,
                last_completed_date: null,
                created_at: new Date().toISOString()
            };
            checkups.push(saved);
        }

        try {
            localStorage.setItem(STORAGE_KEYS.CHECKUPS, JSON.stringify(checkups));
            return saved;
        } catch (e) {
            console.error('Error saving checkup:', e);
            return null;
        }
    },

    deleteWeeklyCheckup(id) {
        try {
            const checkups = this.getWeeklyCheckups().filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEYS.CHECKUPS, JSON.stringify(checkups));
            return true;
        } catch (e) {
            console.error('Error deleting checkup:', e);
            return false;
        }
    },

    markCheckupCompleted(id) {
        const checkups = this.getWeeklyCheckups();
        const item = checkups.find(c => c.id === id);
        if (item) {
            item.last_completed_date = this.getTodayDateString();
            localStorage.setItem(STORAGE_KEYS.CHECKUPS, JSON.stringify(checkups));
            return true;
        }
        return false;
    },

    getNextWeeklyCheckup() {
        const checkups = this.getWeeklyCheckups().filter(c => c.enabled);
        if (checkups.length === 0) return null;

        const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const now = new Date();
        const currentDayIdx = now.getDay();
        const currentTime = this.getCurrentTimeString();

        // Sort checkups by days remaining until next occurrence
        const sorted = [...checkups].sort((a, b) => {
            let diffA = daysOrder.indexOf(a.day_of_week) - currentDayIdx;
            if (diffA < 0 || (diffA === 0 && a.time < currentTime)) diffA += 7;

            let diffB = daysOrder.indexOf(b.day_of_week) - currentDayIdx;
            if (diffB < 0 || (diffB === 0 && b.time < currentTime)) diffB += 7;

            if (diffA === diffB) {
                return a.time.localeCompare(b.time);
            }
            return diffA - diffB;
        });

        return sorted[0] || null;
    },

    // ---------------------------------------------
    // Reminders & Upcoming schedule
    // ---------------------------------------------
    getUpcomingReminders() {
        const todayLogs = this.getTodayLogs();
        const currentTime = this.getCurrentTimeString();

        // Today's remaining pending doses
        const todayUpcoming = todayLogs.filter(l => 
            l.status === 'Pending' && l.scheduled_time >= currentTime
        );

        return todayUpcoming;
    },

    // ---------------------------------------------
    // Triggered Alert Cache (prevent duplicate popups)
    // ---------------------------------------------
    hasAlertBeenTriggered(alertKey) {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TRIGGERED_ALERTS);
            const alerts = data ? JSON.parse(data) : {};
            return !!alerts[alertKey];
        } catch (e) {
            return false;
        }
    },

    markAlertAsTriggered(alertKey) {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TRIGGERED_ALERTS);
            const alerts = data ? JSON.parse(data) : {};
            alerts[alertKey] = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.TRIGGERED_ALERTS, JSON.stringify(alerts));
        } catch (e) {
            console.error('Error caching triggered alert:', e);
        }
    },

    clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.MEDICINES);
            localStorage.removeItem(STORAGE_KEYS.LOGS);
            localStorage.removeItem(STORAGE_KEYS.TRIGGERED_ALERTS);
            localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
            localStorage.removeItem(STORAGE_KEYS.WEIGHT_LOGS);
            localStorage.removeItem(STORAGE_KEYS.CHECKUPS);
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    }
};

// Expose globally
window.StorageManager = StorageManager;
