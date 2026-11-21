document.addEventListener('DOMContentLoaded', function () {
    function getLocalDateString(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const STORAGE_KEY = 'grand_luxury_promotions';

        const kpiTotalEl = document.getElementById('kpiTotalPromo');
    const kpiActiveEl = document.getElementById('kpiActivePromo');
    const kpiUpcomingEl = document.getElementById('kpiUpcomingPromo');
    const kpiEndedEl = document.getElementById('kpiEndedPromo');

    const emptyBox = document.getElementById('emptyPromotions');
    const tableContainer = document.getElementById('promotionsTableContainer');
    const tableBody = document.getElementById('promoTableBody');
    const noMatchBox = document.getElementById('noPromoFilterMatch');

    const searchInput = document.getElementById('promoSearchInput');
    const filterStatus = document.getElementById('promoFilterStatus');
    const filterTarget = document.getElementById('promoFilterTarget');

    const modalEl = document.getElementById('modalAddPromotion');
    const modalTitle = document.getElementById('modalPromoLabel');
    const btnSubmitModal = document.getElementById('btnSubmitAddPromo');
    const editIdInput = document.getElementById('editPromoId');

    const nameInput = document.getElementById('addPromoName');
    const descInput = document.getElementById('addPromoDesc');
    const scopeRoomType = document.getElementById('scopeRoomType');
    const scopeSpecificRoom = document.getElementById('scopeSpecificRoom');
    const boxSelectRoomType = document.getElementById('boxSelectRoomType');
    const boxSelectSpecificRoom = document.getElementById('boxSelectSpecificRoom');
    const roomTypeSelect = document.getElementById('addRoomTypeSelect');
    const specificRoomSelect = document.getElementById('addSpecificRoomSelect');
    const discountPercentInput = document.getElementById('addDiscountPercent');
    const startDateInput = document.getElementById('addStartDate');
    const endDateInput = document.getElementById('addEndDate');
    const statusActiveSwitch = document.getElementById('addStatusActive');

    const previewBasePriceEl = document.getElementById('previewBasePrice');
    const previewDiscountAmountEl = document.getElementById('previewDiscountAmount');
    const previewFinalPriceEl = document.getElementById('previewFinalPrice');
    const previewSavingNoteEl = document.getElementById('previewSavingNote');
    const conflictAlert = document.getElementById('alertScheduleConflict');
    const conflictText = document.getElementById('conflictWarningText');

    const toastEl = document.getElementById('promoLiveToast');
    const toastMsg = document.getElementById('promoToastMessage');

    function showToast(msg) {
        if (toastEl && toastMsg) {
            toastMsg.textContent = msg;
            const bsToast = new bootstrap.Toast(toastEl);
            bsToast.show();
        }
    }

    function formatVND(num) {
        return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ';
    }

    function formatDateDisplay(dStr) {
        if (!dStr) return '';
        const parts = dStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dStr;
    }

    function getStoragePromotions() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setStoragePromotions(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    // Đánh giá trạng thái động của chương trình dựa trên thời gian và cờ kích hoạt
    function evaluateStatus(promo) {
        if (!promo.active) {
            return {
                code: 'PAUSED',
                label: 'Tạm dừng',
                badgeClass: 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25',
                icon: 'bi-pause-circle'
            };
        }
        const today = getLocalDateString(new Date());
        if (today < promo.startDate) {
            return {
                code: 'UPCOMING',
                label: 'Sắp diễn ra',
                badgeClass: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25',
                icon: 'bi-clock-history'
            };
        } else if (today > promo.endDate) {
            return {
                code: 'ENDED',
                label: 'Đã kết thúc',
                badgeClass: 'bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25',
                icon: 'bi-dash-circle'
            };
        } else {
            return {
                code: 'ACTIVE',
                label: 'Đang hoạt động',
                badgeClass: 'bg-success bg-opacity-10 text-success border border-success border-opacity-25',
                icon: 'bi-check-circle'
            };
        }
    }

        function getSelectedBasePrice() {
        if (scopeSpecificRoom && scopeSpecificRoom.checked) {
            const opt = specificRoomSelect.options[specificRoomSelect.selectedIndex];
            return parseFloat(opt ? opt.dataset.basePrice || 2500000 : 2500000);
        } else {
            const opt = roomTypeSelect.options[roomTypeSelect.selectedIndex];
            return parseFloat(opt ? opt.dataset.basePrice || 2500000 : 2500000);
        }
    }

    function calculateLivePricePreview() {
        const basePrice = getSelectedBasePrice();
        let percent = parseFloat(discountPercentInput.value);

        if (isNaN(percent) || percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        const discountAmount = basePrice * (percent / 100);
        const finalPrice = Math.max(0, basePrice - discountAmount);

        if (previewBasePriceEl) previewBasePriceEl.textContent = formatVND(basePrice);
        if (previewDiscountAmountEl) {
            previewDiscountAmountEl.textContent = `-${formatVND(discountAmount)} (${percent}%)`;
        }
        if (previewFinalPriceEl) previewFinalPriceEl.textContent = formatVND(finalPrice);
        if (previewSavingNoteEl) {
            previewSavingNoteEl.textContent = `Tiết kiệm: ${formatVND(discountAmount)}/đêm`;
        }

        checkScheduleOverlap();
    }

    function checkScheduleOverlap() {
        const currentId = editIdInput.value;
        const scope = scopeSpecificRoom.checked ? 'PHONG_RIENG' : 'LOAI_PHONG';
        const targetVal = scope === 'PHONG_RIENG' ? specificRoomSelect.value : roomTypeSelect.value;
        const start = startDateInput.value;
        const end = endDateInput.value;

        if (!start || !end) {
            if (conflictAlert) conflictAlert.classList.add('d-none');
            if (btnSubmitModal) btnSubmitModal.disabled = false;
            return false;
        }

        const promotions = getStoragePromotions();
        const conflict = promotions.find(p => {
            if (currentId && String(p.id) === String(currentId)) return false;
            if (!p.active) return false;
            
            const sameTarget = (p.scope === scope && p.targetValue === targetVal);
            if (!sameTarget) return false;

            // Kiem tra giao thoa khoang thoi gian: start1 <= end2 && end1 >= start2
            return (start <= p.endDate && end >= p.startDate);
        });

        if (conflict && conflictAlert) {
            conflictText.textContent = `Chương trình "${conflict.name}" đang áp dụng cho đối tượng này từ ${formatDateDisplay(conflict.startDate)} đến ${formatDateDisplay(conflict.endDate)}. Vui lòng chọn khoảng thời gian khác hoặc đối tượng khác.`;
            conflictAlert.classList.remove('d-none');
            if (btnSubmitModal) btnSubmitModal.disabled = true;
            return true;
        } else {
            if (conflictAlert) conflictAlert.classList.add('d-none');
            if (btnSubmitModal) btnSubmitModal.disabled = false;
            return false;
        }
    }

        function renderPromotions() {
        const promotions = getStoragePromotions();

                let activeCount = 0;
        let upcomingCount = 0;
        let endedCount = 0;

        promotions.forEach(p => {
            const st = evaluateStatus(p);
            if (st.code === 'ACTIVE') activeCount++;
            else if (st.code === 'UPCOMING') upcomingCount++;
            else endedCount++;
        });

        if (kpiTotalEl) kpiTotalEl.textContent = promotions.length;
        if (kpiActiveEl) kpiActiveEl.textContent = activeCount;
        if (kpiUpcomingEl) kpiUpcomingEl.textContent = upcomingCount;
        if (kpiEndedEl) kpiEndedEl.textContent = endedCount;

                if (promotions.length === 0) {
            if (emptyBox) emptyBox.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');
            if (noMatchBox) noMatchBox.classList.add('d-none');
            return;
        }

        if (emptyBox) emptyBox.classList.add('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

                const query = (searchInput.value || '').toLowerCase().trim();
        const statusFilter = filterStatus.value;
        const targetFilter = filterTarget.value;

        const filtered = promotions.filter(p => {
            const st = evaluateStatus(p);
            const matchName = !query || p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query));
            const matchStatus = (statusFilter === 'ALL') || (st.code === statusFilter);
            let matchTarget = true;
            if (targetFilter === 'A' || targetFilter === 'B' || targetFilter === 'C') {
                matchTarget = (p.scope === 'LOAI_PHONG' && p.targetValue === targetFilter) || (p.scope === 'PHONG_RIENG' && p.roomType === targetFilter);
            } else if (targetFilter === 'ROOM') {
                matchTarget = (p.scope === 'PHONG_RIENG');
            }
            return matchName && matchStatus && matchTarget;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = '';
            if (noMatchBox) noMatchBox.classList.remove('d-none');
            return;
        }

        if (noMatchBox) noMatchBox.classList.add('d-none');

                tableBody.innerHTML = filtered.map((p, idx) => {
            const st = evaluateStatus(p);
            const targetBadge = p.scope === 'LOAI_PHONG'
                ? `<span class="badge bg-light text-dark border rounded-pill px-3 py-1"><i class="bi bi-layers me-1"></i>Loại phòng ${p.targetValue}</span>`
                : `<span class="badge bg-light text-primary border rounded-pill px-3 py-1"><i class="bi bi-door-closed me-1"></i>Phòng ${p.targetValue}</span>`;

            const toggleBtnTitle = p.active ? 'Tạm dừng chương trình' : 'Kích hoạt chương trình';
            const toggleBtnClass = p.active ? 'btn-outline-warning text-dark' : 'btn-outline-success';
            const toggleIcon = p.active ? 'bi-pause-fill' : 'bi-play-fill';

            return `
                <tr class="promo-row" data-id="${p.id}">
                    <td class="text-center fw-bold text-muted">${idx + 1}</td>
                    <td>
                        <strong class="text-dark d-block">${escapeHtml(p.name)}</strong>
                        <small class="text-muted">${escapeHtml(p.description || 'Chương trình ưu đãi đặt phòng')}</small>
                    </td>
                    <td>${targetBadge}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge-promo">GIẢM ${p.discountPercent}%</span>
                            <span class="price-original">${formatVND(p.basePrice)}</span>
                        </div>
                        <div class="price-tag price-promo fs-6">${formatVND(p.finalPrice)}<small class="text-muted fw-normal ms-1">/đêm</small></div>
                        <small class="saving-text"><i class="bi bi-check2 me-1"></i>Tiết kiệm ${formatVND(p.discountAmount)}/đêm</small>
                    </td>
                    <td class="small text-muted">
                        <div><i class="bi bi-calendar-event me-1"></i>${formatDateDisplay(p.startDate)} &rarr; ${formatDateDisplay(p.endDate)}</div>
                    </td>
                    <td class="text-center">
                        <span class="badge ${st.badgeClass} rounded-pill px-3 py-1">
                            <i class="bi ${st.icon} me-1"></i>${st.label}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-1">
                            <button type="button" class="btn btn-sm ${toggleBtnClass} rounded-circle" title="${toggleBtnTitle}" data-action="toggle" data-id="${p.id}" style="width: 32px; height: 32px; padding: 0;">
                                <i class="bi ${toggleIcon}"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-dark rounded-circle" title="Chỉnh sửa chương trình" data-action="edit" data-id="${p.id}" style="width: 32px; height: 32px; padding: 0;">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger rounded-circle" title="Xóa chương trình" data-action="delete" data-id="${p.id}" style="width: 32px; height: 32px; padding: 0;">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

        function openCreateModal() {
        editIdInput.value = '';
        modalTitle.textContent = 'Tạo Chương Trình Khuyến Mại & Ưu Đãi';
        btnSubmitModal.textContent = 'Lưu chương trình ưu đãi';

        document.getElementById('formAddPromotion').reset();
        scopeRoomType.checked = true;
        boxSelectRoomType.classList.remove('d-none');
        boxSelectSpecificRoom.classList.add('d-none');

        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        startDateInput.value = getLocalDateString(today);
        endDateInput.value = getLocalDateString(nextMonth);
        discountPercentInput.value = 20;
        statusActiveSwitch.checked = true;

        clearErrors();
        calculateLivePricePreview();

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }

        function openEditModal(id) {
        const promotions = getStoragePromotions();
        const promo = promotions.find(p => String(p.id) === String(id));
        if (!promo) return;

        editIdInput.value = promo.id;
        modalTitle.textContent = 'Chỉnh Sửa Chương Trình Khuyến Mại';
        btnSubmitModal.textContent = 'Cập nhật thay đổi';

        nameInput.value = promo.name;
        descInput.value = promo.description || '';
        discountPercentInput.value = promo.discountPercent;
        startDateInput.value = promo.startDate;
        endDateInput.value = promo.endDate;
        statusActiveSwitch.checked = !!promo.active;

        if (promo.scope === 'PHONG_RIENG') {
            scopeSpecificRoom.checked = true;
            boxSelectRoomType.classList.add('d-none');
            boxSelectSpecificRoom.classList.remove('d-none');
            specificRoomSelect.value = promo.targetValue;
        } else {
            scopeRoomType.checked = true;
            boxSelectRoomType.classList.remove('d-none');
            boxSelectSpecificRoom.classList.add('d-none');
            roomTypeSelect.value = promo.targetValue;
        }

        clearErrors();
        calculateLivePricePreview();

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }

    function clearErrors() {
        document.getElementById('errPromoName').classList.add('d-none');
        document.getElementById('errDiscountPercent').classList.add('d-none');
        document.getElementById('errStartDate').classList.add('d-none');
        document.getElementById('errEndDate').classList.add('d-none');
        if (conflictAlert) conflictAlert.classList.add('d-none');
    }

        function handleSavePromotion() {
        const name = nameInput.value.trim();
        const percent = parseFloat(discountPercentInput.value);
        const startVal = startDateInput.value;
        const endVal = endDateInput.value;

        let hasError = false;

        if (!name) {
            document.getElementById('errPromoName').classList.remove('d-none');
            hasError = true;
        } else {
            document.getElementById('errPromoName').classList.add('d-none');
        }

        if (isNaN(percent) || percent <= 0 || percent > 100) {
            document.getElementById('errDiscountPercent').classList.remove('d-none');
            hasError = true;
        } else {
            document.getElementById('errDiscountPercent').classList.add('d-none');
        }

        if (!startVal) {
            document.getElementById('errStartDate').classList.remove('d-none');
            hasError = true;
        } else {
            document.getElementById('errStartDate').classList.add('d-none');
        }

        if (!endVal || endVal < startVal) {
            document.getElementById('errEndDate').classList.remove('d-none');
            hasError = true;
        } else {
            document.getElementById('errEndDate').classList.add('d-none');
        }

        if (hasError) return;

        const isSpecific = scopeSpecificRoom.checked;
        const scope = isSpecific ? 'PHONG_RIENG' : 'LOAI_PHONG';
        const targetValue = isSpecific ? specificRoomSelect.value : roomTypeSelect.value;
        const basePrice = getSelectedBasePrice();
        const discountAmount = basePrice * (percent / 100);
        const finalPrice = Math.max(0, basePrice - discountAmount);

        let roomType = targetValue;
        if (isSpecific) {
            const opt = specificRoomSelect.options[specificRoomSelect.selectedIndex];
            roomType = opt ? opt.dataset.type || 'A' : 'A';
        }

        const promotions = getStoragePromotions();
        const editId = editIdInput.value;

        if (editId) {
            const idx = promotions.findIndex(p => String(p.id) === String(editId));
            if (idx !== -1) {
                promotions[idx] = {
                    ...promotions[idx],
                    name: name,
                    description: descInput.value.trim(),
                    scope: scope,
                    targetValue: targetValue,
                    roomType: roomType,
                    basePrice: basePrice,
                    discountPercent: percent,
                    discountAmount: discountAmount,
                    finalPrice: finalPrice,
                    startDate: startVal,
                    endDate: endVal,
                    active: statusActiveSwitch.checked,
                    updatedAt: new Date().toISOString()
                };
                setStoragePromotions(promotions);
                showToast(`Đã cập nhật chương trình ưu đãi "${name}".`);
            }
        } else {
            const newId = promotions.length > 0 ? Math.max(...promotions.map(p => p.id || 0)) + 1 : 1;
            const newPromo = {
                id: newId,
                name: name,
                description: descInput.value.trim(),
                scope: scope,
                targetValue: targetValue,
                roomType: roomType,
                basePrice: basePrice,
                discountPercent: percent,
                discountAmount: discountAmount,
                finalPrice: finalPrice,
                startDate: startVal,
                endDate: endVal,
                active: statusActiveSwitch.checked,
                createdAt: new Date().toISOString()
            };
            promotions.push(newPromo);
            setStoragePromotions(promotions);
            showToast(`Đã tạo thành công chương trình ưu đãi "${name}".`);
        }

        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();

        renderPromotions();
    }

        function togglePromotion(id) {
        const promotions = getStoragePromotions();
        const promo = promotions.find(p => String(p.id) === String(id));
        if (promo) {
            promo.active = !promo.active;
            setStoragePromotions(promotions);
            const statusMsg = promo.active ? 'Đã kích hoạt' : 'Đã tạm dừng';
            showToast(`${statusMsg} chương trình "${promo.name}".`);
            renderPromotions();
        }
    }

        function deletePromotion(id) {
        const promotions = getStoragePromotions();
        const promo = promotions.find(p => String(p.id) === String(id));
        if (!promo) return;

        if (confirm(`Bạn có chắc chắn muốn xóa chương trình khuyến mại "${promo.name}"? Thao tác này không thể hoàn tác.`)) {
            const filtered = promotions.filter(p => String(p.id) !== String(id));
            setStoragePromotions(filtered);
            showToast(`Đã xóa chương trình "${promo.name}" thành công.`);
            renderPromotions();
        }
    }

        const btnOpenCreate = document.getElementById('btnOpenCreatePromo');
    const btnEmptyCreate = document.getElementById('btnEmptyCreatePromo');
    if (btnOpenCreate) btnOpenCreate.addEventListener('click', openCreateModal);
    if (btnEmptyCreate) btnEmptyCreate.addEventListener('click', openCreateModal);

        if (scopeRoomType && scopeSpecificRoom) {
        scopeRoomType.addEventListener('change', function () {
            boxSelectRoomType.classList.remove('d-none');
            boxSelectSpecificRoom.classList.add('d-none');
            calculateLivePricePreview();
        });

        scopeSpecificRoom.addEventListener('change', function () {
            boxSelectRoomType.classList.add('d-none');
            boxSelectSpecificRoom.classList.remove('d-none');
            calculateLivePricePreview();
        });
    }

    if (roomTypeSelect) roomTypeSelect.addEventListener('change', calculateLivePricePreview);
    if (specificRoomSelect) specificRoomSelect.addEventListener('change', calculateLivePricePreview);
    if (discountPercentInput) discountPercentInput.addEventListener('input', calculateLivePricePreview);
    if (startDateInput) startDateInput.addEventListener('change', checkScheduleOverlap);
    if (endDateInput) endDateInput.addEventListener('change', checkScheduleOverlap);
    if (roomTypeSelect) roomTypeSelect.addEventListener('change', checkScheduleOverlap);
    if (specificRoomSelect) specificRoomSelect.addEventListener('change', checkScheduleOverlap);
    if (scopeRoomType) scopeRoomType.addEventListener('change', checkScheduleOverlap);
    if (scopeSpecificRoom) scopeSpecificRoom.addEventListener('change', checkScheduleOverlap);

    if (btnSubmitModal) btnSubmitModal.addEventListener('click', handleSavePromotion);

        if (searchInput) searchInput.addEventListener('input', renderPromotions);
    if (filterStatus) filterStatus.addEventListener('change', renderPromotions);
    if (filterTarget) filterTarget.addEventListener('change', renderPromotions);

        if (tableBody) {
        tableBody.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'toggle') {
                togglePromotion(id);
            } else if (action === 'edit') {
                openEditModal(id);
            } else if (action === 'delete') {
                deletePromotion(id);
            }
        });
    }

        renderPromotions();
});
