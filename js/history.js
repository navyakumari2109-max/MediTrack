/**
 * MediTrack - Medicine History & Audit Log
 * Single User Medicine Reminder System
 * Academic B.Tech Project
 */

const HistoryPage = {
    init() {
        this.renderHistory();
        this.setupFilters();
        this.setupClear();
    },

    setupFilters() {
        const searchInput = document.getElementById('history-search');
        const statusFilter = document.getElementById('history-status-filter');
        const dateFilter = document.getElementById('history-date-filter');

        const triggerFilter = () => {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const status = statusFilter ? statusFilter.value : 'All';
            const date = dateFilter ? dateFilter.value : '';
            this.renderHistory(query, status, date);
        };

        if (searchInput) searchInput.addEventListener('input', triggerFilter);
        if (statusFilter) statusFilter.addEventListener('change', triggerFilter);
        if (dateFilter) dateFilter.addEventListener('change', triggerFilter);

        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (statusFilter) statusFilter.value = 'All';
                if (dateFilter) dateFilter.value = '';
                this.renderHistory();
            });
        }
    },

    setupClear() {
        const clearBtn = document.getElementById('btn-clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.confirmClearHistory());
        }
    },

    renderHistory(query = '', statusFilter = 'All', dateFilter = '') {
        const tbody = document.getElementById('history-table-body');
        const emptyState = document.getElementById('history-empty-state');
        const countBadge = document.getElementById('history-count-badge');
        const adherenceBadge = document.getElementById('history-adherence-badge');
        if (!tbody) return;

        let logs = StorageManager.getLogs();

        // Sort descending by date and time
        logs.sort((a, b) => {
            if (a.scheduled_date === b.scheduled_date) {
                return b.scheduled_time.localeCompare(a.scheduled_time);
            }
            return b.scheduled_date.localeCompare(a.scheduled_date);
        });

        // Compute overall adherence stats
        if (adherenceBadge && logs.length > 0) {
            const takenCount = logs.filter(l => l.status === 'Taken').length;
            const percentage = Math.round((takenCount / logs.length) * 100);
            adherenceBadge.textContent = `Overall Adherence: ${percentage}%`;
        } else if (adherenceBadge) {
            adherenceBadge.textContent = 'Overall Adherence: 0%';
        }

        // Apply filters
        if (query) {
            logs = logs.filter(l => 
                (l.medicine_name && l.medicine_name.toLowerCase().includes(query)) ||
                (l.dosage && l.dosage.toLowerCase().includes(query)) ||
                (l.instructions && l.instructions.toLowerCase().includes(query))
            );
        }

        if (statusFilter !== 'All') {
            logs = logs.filter(l => l.status === statusFilter);
        }

        if (dateFilter) {
            logs = logs.filter(l => l.scheduled_date === dateFilter);
        }

        if (countBadge) {
            countBadge.textContent = `${logs.length} Records Found`;
        }

        if (logs.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = logs.map(log => {
            let statusBadge = '';
            if (log.status === 'Taken') {
                statusBadge = '<span class="badge-status status-taken"><i class="fas fa-check-circle"></i> Taken</span>';
            } else if (log.status === 'Missed') {
                statusBadge = '<span class="badge-status status-missed"><i class="fas fa-circle-xmark"></i> Missed</span>';
            } else {
                statusBadge = '<span class="badge-status status-pending"><i class="far fa-clock"></i> Pending</span>';
            }

            return `
                <tr>
                    <td class="fw-bold text-dark align-middle">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-pills text-primary"></i>
                            <div>
                                <div>${App.escapeHtml(log.medicine_name)}</div>
                                <small class="text-muted fw-normal">${App.escapeHtml(log.medicine_type || 'Medicine')}</small>
                            </div>
                        </div>
                    </td>
                    <td class="align-middle text-dark fw-medium">${App.escapeHtml(log.dosage)}</td>
                    <td class="align-middle text-muted small">${App.escapeHtml(log.instructions || 'N/A')}</td>
                    <td class="align-middle text-dark">
                        <i class="far fa-calendar text-muted me-1"></i> ${StorageManager.formatDateForDisplay(log.scheduled_date)}
                    </td>
                    <td class="align-middle text-dark fw-semibold">
                        <i class="far fa-clock text-primary me-1"></i> ${StorageManager.formatTimeForDisplay(log.scheduled_time)}
                    </td>
                    <td class="align-middle">${statusBadge}</td>
                    <td class="align-middle text-end">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Update
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item text-success" href="javascript:void(0)" onclick="HistoryPage.updateStatus('${log.id}', 'Taken')"><i class="fas fa-check me-2"></i> Mark as Taken</a></li>
                                <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="HistoryPage.updateStatus('${log.id}', 'Missed')"><i class="fas fa-xmark me-2"></i> Mark as Missed</a></li>
                                <li><a class="dropdown-item text-warning" href="javascript:void(0)" onclick="HistoryPage.updateStatus('${log.id}', 'Pending')"><i class="far fa-clock me-2"></i> Mark as Pending</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateStatus(logId, newStatus) {
        StorageManager.updateLogStatus(logId, newStatus);
        App.showToast(`Log updated to ${newStatus}`, 'success');
        this.renderHistory();
        App.updateNavBadges();
    },

    confirmClearHistory() {
        if (!confirm('Are you sure you want to clear all medicine history logs? This will not delete your saved medicines.')) {
            return;
        }

        StorageManager.saveLogs([]);
        App.showToast('All dose history cleared.', 'info');
        this.renderHistory();
        App.updateNavBadges();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    HistoryPage.init();
});

window.HistoryPage = HistoryPage;
