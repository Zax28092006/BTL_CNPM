/**
 * Grand Luxury Hotel - Bộ lọc phòng Client-side (Không reload trang)
 * Kết hợp lọc đồng thời theo loại phòng và từ khóa tìm kiếm,
 * chuyển cảnh trượt 2 hướng mượt mà, và đồng bộ URL qua history.replaceState.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', initRoomFilter);

    function initRoomFilter() {
        const filterTabs = Array.from(document.querySelectorAll('.filter-tab'));
        const roomGridContainer = document.getElementById('roomGridContainer');
        const roomCards = Array.from(document.querySelectorAll('.room-item'));
        const searchForm = document.getElementById('roomSearchForm');
        const searchInput = document.getElementById('roomSearchInput');
        const clearBtn = document.getElementById('clearRoomSearch');
        const noRoomsFound = document.getElementById('noRoomsFound');
        const resetBtn = document.getElementById('resetRoomFilters');

        if (!roomGridContainer || roomCards.length === 0) return;

        // Chuẩn hóa chuỗi tiếng Việt không dấu để người dùng tìm kiếm thuận tiện
        function removeVietnameseAccents(str) {
            if (!str) return '';
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .toLowerCase()
                .trim();
        }

                const cardCache = roomCards.map(function (cardEl) {
            const rawSearch = (cardEl.getAttribute('data-search') || '').trim().toLowerCase();
            return {
                el: cardEl,
                loai: (cardEl.getAttribute('data-loai') || '').trim().toUpperCase(),
                searchRaw: rawSearch,
                searchNormalized: removeVietnameseAccents(rawSearch)
            };
        });

        // Bảng tra vị trí tab phục vụ xác định hướng trượt (trái sang phải hoặc ngược lại)
        const tabIndexMap = {};
        filterTabs.forEach(function (tab, idx) {
            tabIndexMap[(tab.getAttribute('data-filter') || 'all').trim()] = idx;
        });

                let currentLoai = 'all';
        let currentKeyword = '';
        let currentTabIndex = 0;
        let transitionTimer = null;

        // Đồng bộ tham số URL bằng replaceState để giữ nguyên vị trí cuộn trang
        function syncUrlState() {
            try {
                const url = new URL(window.location.href);

                if (currentLoai && currentLoai !== 'all') {
                    url.searchParams.set('loai', currentLoai);
                } else {
                    url.searchParams.delete('loai');
                }

                if (currentKeyword.trim()) {
                    url.searchParams.set('tu_khoa', currentKeyword.trim());
                } else {
                    url.searchParams.delete('tu_khoa');
                }

                const query = url.searchParams.toString();
                const newPath = url.pathname + (query ? '?' + query : '') + url.hash;
                window.history.replaceState(null, '', newPath);
            } catch (err) {
                // Bỏ qua nếu môi trường chạy hạn chế quyền đổi URL
            }
        }

        // Áp dụng bộ lọc kết hợp: Loại phòng AND Từ khóa
        function applyRoomFilters(isTabChange, oldIdx, newIdx, skipAnimation) {
            // Hủy transition trước đó nếu người dùng click đổi tab liên tục
            if (transitionTimer) {
                clearTimeout(transitionTimer);
                transitionTimer = null;
                roomGridContainer.classList.remove('is-exiting', 'enter-from-right', 'enter-from-left');
            }

            const rawKeyword = currentKeyword.trim().toLowerCase();
            const normalizedKeyword = removeVietnameseAccents(rawKeyword);
            const normalizedLoai = currentLoai.trim().toUpperCase();

                        function updateCardVisibility() {
                let matchCount = 0;

                cardCache.forEach(function (item) {
                    const matchLoai = (normalizedLoai === 'ALL' || item.loai === normalizedLoai);
                    const matchKeyword = (!rawKeyword ||
                        item.searchRaw.includes(rawKeyword) ||
                        item.searchNormalized.includes(normalizedKeyword));

                    const isVisible = matchLoai && matchKeyword;
                    item.el.classList.toggle('d-none', !isVisible);
                    if (isVisible) matchCount++;
                });

                if (noRoomsFound) {
                    noRoomsFound.classList.toggle('d-none', matchCount > 0);
                }
            }

            const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Nếu người dùng bật giảm chuyển động hoặc tải trang ban đầu: cập nhật ngay
            if (skipAnimation || prefersReducedMotion) {
                updateCardVisibility();
                syncUrlState();
                return;
            }

            // Xác định hướng trượt dựa trên sự thay đổi thứ tự tab
            const directionClass = (isTabChange && oldIdx !== newIdx)
                ? (newIdx > oldIdx ? 'enter-from-right' : 'enter-from-left')
                : '';

            // Pha 1: Fade out nhẹ nhàng (140ms)
            roomGridContainer.classList.add('is-exiting');

            transitionTimer = setTimeout(function () {
                updateCardVisibility();
                roomGridContainer.classList.remove('is-exiting');

                if (directionClass) {
                    roomGridContainer.classList.add(directionClass);
                }

                // Pha 2: Trượt êm vào vị trí và dọn class hiệu ứng (140ms)
                transitionTimer = setTimeout(function () {
                    if (directionClass) {
                        roomGridContainer.classList.remove(directionClass);
                    }
                    transitionTimer = null;
                }, 140);
            }, 140);

            syncUrlState();
        }

                function updateActiveTabVisual(targetFilter) {
            filterTabs.forEach(function (tab) {
                const filterVal = (tab.getAttribute('data-filter') || 'all').trim();
                const isActive = (filterVal.toLowerCase() === targetFilter.toLowerCase());
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

                filterTabs.forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                e.preventDefault();
                const targetFilter = (this.getAttribute('data-filter') || 'all').trim();
                if (targetFilter.toLowerCase() === currentLoai.toLowerCase()) return;

                const oldIdx = currentTabIndex;
                const newIdx = tabIndexMap[targetFilter] !== undefined ? tabIndexMap[targetFilter] : 0;

                currentLoai = targetFilter;
                currentTabIndex = newIdx;

                updateActiveTabVisual(currentLoai);
                applyRoomFilters(true, oldIdx, newIdx, false);
            });
        });

                if (searchInput) {
            searchInput.addEventListener('input', function () {
                currentKeyword = this.value;
                if (clearBtn) {
                    clearBtn.classList.toggle('d-none', currentKeyword.length === 0);
                }
                applyRoomFilters(false, currentTabIndex, currentTabIndex, false);
            });
        }

                if (searchForm) {
            searchForm.addEventListener('submit', function (e) {
                e.preventDefault();
                if (searchInput) {
                    currentKeyword = searchInput.value;
                    searchInput.blur();
                }
                applyRoomFilters(false, currentTabIndex, currentTabIndex, false);
            });
        }

                if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
                currentKeyword = '';
                clearBtn.classList.add('d-none');
                applyRoomFilters(false, currentTabIndex, currentTabIndex, false);
            });
        }

                if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                const oldIdx = currentTabIndex;
                currentLoai = 'all';
                currentTabIndex = 0;
                currentKeyword = '';

                if (searchInput) searchInput.value = '';
                if (clearBtn) clearBtn.classList.add('d-none');

                updateActiveTabVisual('all');
                applyRoomFilters(true, oldIdx, 0, false);
            });
        }

                try {
            const urlParams = new URLSearchParams(window.location.search);
            const loaiParam = urlParams.get('loai');
            const tuKhoaParam = urlParams.get('tu_khoa');

            if (loaiParam && tabIndexMap[loaiParam] !== undefined) {
                currentLoai = loaiParam;
                currentTabIndex = tabIndexMap[loaiParam];
            }

            if (tuKhoaParam) {
                currentKeyword = tuKhoaParam;
                if (searchInput) searchInput.value = tuKhoaParam;
                if (clearBtn) clearBtn.classList.remove('d-none');
            }

            updateActiveTabVisual(currentLoai);

            if (currentLoai !== 'all' || currentKeyword) {
                applyRoomFilters(false, currentTabIndex, currentTabIndex, true);
            }
        } catch (e) {
            updateActiveTabVisual('all');
        }
    }
})();
