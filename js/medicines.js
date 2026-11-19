/**
 * MediTrack - Medicines Management & Form Controller
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const Medicines = {
    currentEditId: null,

    init() {
        // Check if we are on the Add/Edit Medicine page
        const medicineForm = document.getElementById('medicine-form');
        if (medicineForm) {
            this.initFormPage();
        }

        // Check if we are on the My Medicines list page
        const medicineListContainer = document.getElementById('medicines-grid-container');
        if (medicineListContainer) {
            this.initListPage();
        }
    },

    // =============================================
    // ADD / EDIT FORM LOGIC
    // =============================================
    initFormPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('id');

        // Set default start date to today
        const startDateInput = document.getElementById('start_date');
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = StorageManager.getTodayDateString();
        }

        // Setup dynamic reminder time inputs
        this.setupReminderTimeControls();

        // Setup frequency change auto-preset
        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                this.handleFrequencyChange(e.target.value);
            });
        }

        // Handle Edit Mode if ID provided
        if (editId) {
            this.currentEditId = editId;
            this.populateFormForEdit(editId);
        }

        // Handle Form Submission
        const form = document.getElementById('medicine-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    },

    setupReminderTimeControls() {
        const addTimeBtn = document.getElementById('btn-add-time');
        const container = document.getElementById('reminder-times-container');

        if (addTimeBtn && container) {
            addTimeBtn.addEventListener('click', () => {
                this.addTimeInputRow();
            });
        }
    },

    addTimeInputRow(defaultTime = '08:00') {
        const container = document.getElementById('reminder-times-container');
        if (!container) return;

        const rowId = 'time_row_' + Math.random().toString(36).substring(2, 7);
        const rowHtml = `
            <div class="d-flex align-items-center gap-2 mb-2 reminder-time-row" id="${rowId}">
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="far fa-clock text-primary"></i></span>
                    <input type="time" class="form-control form-control-custom reminder-time-input" required value="${defaultTime}">
                </div>
                <button type="button" class="btn btn-outline-danger btn-sm rounded-3 px-3" title="Remove Time" onclick="Medicines.removeTimeInputRow('${rowId}')">
                    <i class="fas fa-trash-can"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    },

    removeTimeInputRow(rowId) {
        const rows = document.querySelectorAll('.reminder-time-row');
        if (rows.length <= 1) {
            App.showToast('At least one reminder time is required.', 'warning');
            return;
        }
        const row = document.getElementById(rowId);
        if (row) row.remove();
    },

    handleFrequencyChange(frequency) {
        const container = document.getElementById('reminder-times-container');
        if (!container) return;

        // If user is editing, don't auto-overwrite unless they specifically want to
        container.innerHTML = '';

        if (frequency === 'Once daily') {
            this.addTimeInputRow('08:00');
        } else if (frequency === 'Twice daily') {
            this.addTimeInputRow('08:00');
            this.addTimeInputRow('20:00');
        } else if (frequency === 'Three times daily') {
            this.addTimeInputRow('08:00');
            this.addTimeInputRow('14:00');
            this.addTimeInputRow('20:00');
        } else {
            // Custom
            this.addTimeInputRow('08:00');
            this.addTimeInputRow('12:00');
        }
    },

    populateFormForEdit(medicineId) {
        const med = StorageManager.getMedicineById(medicineId);
        if (!med) {
            App.showToast('Medicine not found.', 'danger');
            setTimeout(() => { window.location.href = 'medicines.html'; }, 1500);
            return;
        }

        // Change page title & header
        const pageTitle = document.getElementById('page-form-title');
        const pageDesc = document.getElementById('page-form-desc');
        const submitBtn = document.getElementById('btn-submit-form');

        if (pageTitle) pageTitle.textContent = 'Edit Medicine Details';
        if (pageDesc) pageDesc.textContent = `Updating information for ${med.medicine_name}`;
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-floppy-disk me-2"></i> Update Medicine';
            submitBtn.classList.replace('btn-primary', 'btn-success');
        }

        // Fill inputs
        document.getElementById('medicine_name').value = med.medicine_name || '';
        document.getElementById('dosage').value = med.dosage || '';
        document.getElementById('medicine_type').value = med.medicine_type || 'Tablet';
        document.getElementById('start_date').value = med.start_date || '';
        document.getElementById('end_date').value = med.end_date || '';
        document.getElementById('frequency').value = med.frequency || 'Once daily';
        document.getElementById('instructions').value = med.instructions || 'After food';
        document.getElementById('remaining_quantity').value = med.remaining_quantity !== undefined ? med.remaining_quantity : 0;
        document.getElementById('expiry_date').value = med.expiry_date || '';
        document.getElementById('notes').value = med.notes || '';

        // Populate reminder times
        const container = document.getElementById('reminder-times-container');
        if (container) {
            container.innerHTML = '';
            if (Array.isArray(med.reminder_times) && med.reminder_times.length > 0) {
                med.reminder_times.forEach(t => this.addTimeInputRow(t));
            } else {
                this.addTimeInputRow('08:00');
            }
        }
    },

    handleFormSubmit() {
        const name = document.getElementById('medicine_name').value.trim();
        const dosage = document.getElementById('dosage').value.trim();
        const medicineType = document.getElementById('medicine_type').value;
        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        const frequency = document.getElementById('frequency').value;
        const instructions = document.getElementById('instructions').value;
        const remainingQuantity = parseInt(document.getElementById('remaining_quantity').value, 10);
        const expiryDate = document.getElementById('expiry_date').value;
        const notes = document.getElementById('notes').value.trim();

        // Collect all reminder times
        const timeInputs = document.querySelectorAll('.reminder-time-input');
        const reminderTimes = [];
        timeInputs.forEach(input => {
            if (input.value && !reminderTimes.includes(input.value)) {
                reminderTimes.push(input.value);
            }
        });

        // Validation
        if (!name) {
            App.showToast('Please enter the medicine name.', 'warning');
            return;
        }

        if (!dosage) {
            App.showToast('Please specify the dosage (e.g., 1 tablet, 5 ml).', 'warning');
            return;
        }

        if (reminderTimes.length === 0) {
            App.showToast('Please add at least one reminder time.', 'warning');
            return;
        }

        if (endDate && startDate && endDate < startDate) {
            App.showToast('End date cannot be earlier than start date.', 'warning');
            return;
        }

        if (isNaN(remainingQuantity) || remainingQuantity < 0) {
            App.showToast('Please enter a valid remaining stock quantity.', 'warning');
            return;
        }

        const payload = {
            id: this.currentEditId || undefined,
            medicine_name: name,
            dosage: dosage,
            medicine_type: medicineType,
            start_date: startDate,
            end_date: endDate,
            frequency: frequency,
            reminder_times: reminderTimes.sort(),
            instructions: instructions,
            remaining_quantity: remainingQuantity,
            expiry_date: expiryDate,
            notes: notes
        };

        const saved = StorageManager.saveMedicine(payload);

        if (saved) {
            App.showToast(this.currentEditId ? 'Medicine updated successfully!' : 'Medicine added successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'medicines.html';
            }, 800);
        } else {
            App.showToast('Failed to save medicine data.', 'danger');
        }
    },

    // =============================================
    // MY MEDICINES LIST PAGE LOGIC
    // =============================================
    initListPage() {
        this.renderMedicinesList();
        this.setupListFilters();
    },

    setupListFilters() {
        const searchInput = document.getElementById('medicine-search');
        const typeFilter = document.getElementById('filter-type');
        const stockFilter = document.getElementById('filter-stock');

        const applyFilters = () => {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const type = typeFilter ? typeFilter.value : 'All';
            const stock = stockFilter ? stockFilter.value : 'All';
            this.renderMedicinesList(query, type, stock);
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (typeFilter) typeFilter.addEventListener('change', applyFilters);
        if (stockFilter) stockFilter.addEventListener('change', applyFilters);
    },

    renderMedicinesList(query = '', typeFilter = 'All', stockFilter = 'All') {
        const container = document.getElementById('medicines-grid-container');
        const emptyState = document.getElementById('medicines-empty-state');
        const countBadge = document.getElementById('medicines-count-badge');
        if (!container) return;

        let medicines = StorageManager.getMedicines();
        const settings = StorageManager.getSettings();
        const today = StorageManager.getTodayDateString();

        // Apply filters
        if (query) {
            medicines = medicines.filter(m => 
                m.medicine_name.toLowerCase().includes(query) ||
                (m.notes && m.notes.toLowerCase().includes(query)) ||
                m.dosage.toLowerCase().includes(query)
            );
        }

        if (typeFilter !== 'All') {
            medicines = medicines.filter(m => m.medicine_type === typeFilter);
        }

        if (stockFilter === 'Low') {
            medicines = medicines.filter(m => parseInt(m.remaining_quantity, 10) <= settings.lowStockThreshold);
        } else if (stockFilter === 'Available') {
            medicines = medicines.filter(m => parseInt(m.remaining_quantity, 10) > settings.lowStockThreshold);
        }

        if (countBadge) {
            countBadge.textContent = `${medicines.length} Medicines`;
        }

        if (medicines.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const typeIconMap = {
            'Tablet': 'fa-tablets text-primary bg-primary-subtle',
            'Capsule': 'fa-capsules text-info bg-info-subtle',
            'Syrup': 'fa-prescription-bottle-medical text-danger bg-danger-subtle',
            'Injection': 'fa-syringe text-warning bg-warning-subtle',
            'Drops': 'fa-eye-dropper text-teal bg-light',
            'Inhaler': 'fa-lungs text-success bg-success-subtle',
            'Other': 'fa-pills text-secondary bg-light'
        };

        const html = medicines.map(med => {
            const isLowStock = parseInt(med.remaining_quantity, 10) <= settings.lowStockThreshold;
            const isExpired = med.expiry_date && med.expiry_date < today;
            const courseProgress = StorageManager.getMedicineCourseProgress(med);

            // Formatted reminder times
            const timesHtml = (med.reminder_times || []).map(t => `
                <span class="time-pill">
                    <i class="far fa-clock text-primary"></i> ${StorageManager.formatTimeForDisplay(t)}
                </span>
            `).join(' ');

            const iconClass = typeIconMap[med.medicine_type] || 'fa-pills text-primary bg-primary-subtle';

            return `
                <div class="col-12 col-md-6 col-xl-4 mb-4">
                    <div class="medicine-grid-card ${isLowStock ? 'border-warning' : ''}">
                        <div>
                            <!-- Header with Type & Stock Badge -->
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="type-avatar ${iconClass}">
                                        <i class="fas ${iconClass.split(' ')[0]}"></i>
                                    </div>
                                    <div>
                                        <h5 class="fw-bold mb-0 text-dark">${App.escapeHtml(med.medicine_name)}</h5>
                                        <span class="text-muted small">${App.escapeHtml(med.dosage)} &bull; ${App.escapeHtml(med.medicine_type)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Course Duration / Days Completed Progress -->
                            ${courseProgress ? `
                            <div class="mb-3 p-2 px-3 rounded-3 bg-primary-subtle d-flex flex-column gap-1">
                                <div class="d-flex justify-content-between align-items-center small">
                                    <span class="fw-bold text-primary"><i class="fas fa-calendar-day me-1"></i> ${courseProgress.label}</span>
                                    ${courseProgress.hasEndDate ? `<span class="badge bg-primary text-white">${courseProgress.percentage}%</span>` : ''}
                                </div>
                                ${courseProgress.hasEndDate ? `
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${courseProgress.percentage}%"></div>
                                </div>
                                ` : ''}
                            </div>
                            ` : ''}

                            <!-- Details list -->
                            <div class="bg-light p-3 rounded-3 mb-3 small">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted"><i class="fas fa-repeat me-1"></i> Frequency:</span>
                                    <span class="fw-bold text-dark">${App.escapeHtml(med.frequency)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted"><i class="fas fa-utensils me-1"></i> Instruction:</span>
                                    <span class="fw-semibold text-dark">${App.escapeHtml(med.instructions)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted"><i class="fas fa-boxes-stacked me-1"></i> Remaining Stock:</span>
                                    <span class="fw-bold ${isLowStock ? 'text-danger' : 'text-success'}">
                                        ${med.remaining_quantity} units ${isLowStock ? '(Low Stock)' : ''}
                                    </span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted"><i class="far fa-calendar-xmark me-1"></i> Expiry Date:</span>
                                    <span class="fw-semibold ${isExpired ? 'text-danger' : 'text-dark'}">
                                        ${StorageManager.formatDateForDisplay(med.expiry_date)} ${isExpired ? '(Expired)' : ''}
                                    </span>
                                </div>
                            </div>

                            <!-- Reminder Schedule Times -->
                            <div class="mb-3">
                                <span class="d-block text-muted small fw-bold mb-1">Scheduled Times:</span>
                                <div class="d-flex flex-wrap gap-1">${timesHtml}</div>
                            </div>

                            ${med.notes ? `
                                <div class="text-muted small fst-italic mb-3">
                                    <i class="far fa-note-sticky me-1"></i> "${App.escapeHtml(med.notes)}"
                                </div>
                            ` : ''}
                        </div>

                        <!-- Card Footer Actions -->
                        <div class="pt-3 border-top d-flex align-items-center justify-content-between">
                            <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="Medicines.openRefillModal('${med.id}', '${App.escapeHtml(med.medicine_name)}', ${med.remaining_quantity})">
                                <i class="fas fa-plus me-1"></i> Refill Stock
                            </button>
                            <div class="d-flex gap-2">
                                <a href="add-medicine.html?id=${med.id}" class="btn btn-sm btn-outline-secondary rounded-circle" title="Edit Medicine" style="width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-pencil"></i>
                                </a>
                                <button type="button" class="btn btn-sm btn-outline-danger rounded-circle" title="Delete Medicine" style="width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;" onclick="Medicines.confirmDelete('${med.id}', '${App.escapeHtml(med.medicine_name)}')">
                                    <i class="fas fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    // ---------------------------------------------
    // Delete Confirmation Modal
    // ---------------------------------------------
    confirmDelete(id, name) {
        const modalId = 'confirm-delete-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.6);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-danger text-white py-3">
                            <h5 class="modal-title fw-bold"><i class="fas fa-triangle-exclamation me-2"></i> Confirm Deletion</h5>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <div class="avatar-icon-lg bg-danger-subtle text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 64px; height: 64px;">
                                <i class="fas fa-trash-can fa-2x"></i>
                            </div>
                            <h5 class="fw-bold mb-2">Delete "${name}"?</h5>
                            <p class="text-muted small mb-0">Are you sure you want to remove this medicine? All future pending reminders for this medicine will also be deleted. This action cannot be undone.</p>
                        </div>
                        <div class="modal-footer bg-light p-3 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary px-4 rounded-pill" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                            <button type="button" class="btn btn-danger px-4 rounded-pill" onclick="Medicines.executeDelete('${id}', '${modalId}')">
                                <i class="fas fa-trash-can me-1"></i> Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    executeDelete(id, modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        const success = StorageManager.deleteMedicine(id);
        if (success) {
            App.showToast('Medicine removed successfully.', 'success');
            this.renderMedicinesList();
            App.updateNavBadges();
        } else {
            App.showToast('Error removing medicine.', 'danger');
        }
    },

    // ---------------------------------------------
    // Quick Stock Refill Modal
    // ---------------------------------------------
    openRefillModal(id, name, currentStock) {
        const modalId = 'refill-stock-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        const html = `
            <div class="modal fade show" id="${modalId}" tabindex="-1" style="display: block; background: rgba(15, 23, 42, 0.6);" aria-modal="true">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-primary text-white py-3">
                            <h6 class="modal-title fw-bold mb-0"><i class="fas fa-plus-circle me-1"></i> Refill Stock</h6>
                            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${modalId}').remove()"></button>
                        </div>
                        <div class="modal-body p-3">
                            <p class="small text-muted mb-2">Medicine: <strong>${name}</strong></p>
                            <p class="small text-muted mb-3">Current Stock: <span class="badge bg-secondary">${currentStock}</span></p>
                            
                            <label class="form-label-custom small">Units to Add:</label>
                            <input type="number" id="refill-units-input" class="form-control form-control-custom mb-3" value="10" min="1" max="1000">

                            <div class="d-flex gap-2 justify-content-end">
                                <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                                <button type="button" class="btn btn-sm btn-primary rounded-pill px-3" onclick="Medicines.executeRefill('${id}', '${modalId}')">
                                    Add Stock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    executeRefill(id, modalId) {
        const input = document.getElementById('refill-units-input');
        const count = input ? parseInt(input.value, 10) : 0;
        if (isNaN(count) || count <= 0) {
            App.showToast('Please enter a valid number of units.', 'warning');
            return;
        }

        StorageManager.updateMedicineStock(id, count);
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();

        App.showToast(`Added ${count} units to stock.`, 'success');
        this.renderMedicinesList();
        App.updateNavBadges();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Medicines.init();
});

window.Medicines = Medicines;
