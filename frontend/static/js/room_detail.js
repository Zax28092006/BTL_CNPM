/**
 * Grand Luxury Hotel - Room Detail Page Scripts
 * Handles gallery, sticky sub-nav, copy link, save room (localStorage),
 * sticky quick bar, amenities toggle, review helpfulness (localStorage).
 */

document.addEventListener('DOMContentLoaded', function () {
    const roomId = document.body.dataset.roomId || window.ROOM_ID || '1';

        const galleryImage = document.getElementById('galleryImage');
    const slideCounter = document.getElementById('slideCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const thumbnailBtns = document.querySelectorAll('.gallery-thumb-btn');

    let images = window.ROOM_IMAGES || [];
    let currentIndex = 0;

    function updateSlide(index) {
        if (!galleryImage || images.length === 0) return;
        currentIndex = (index + images.length) % images.length;
        galleryImage.src = images[currentIndex];

        if (slideCounter) {
            const curStr = String(currentIndex + 1).padStart(2, '0');
            const totalStr = String(images.length).padStart(2, '0');
            slideCounter.textContent = `${curStr} / ${totalStr}`;
        }

        thumbnailBtns.forEach((btn, idx) => {
            if (idx === currentIndex) {
                btn.classList.add('border-dark', 'active');
            } else {
                btn.classList.remove('border-dark', 'active');
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            updateSlide(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            updateSlide(currentIndex + 1);
        });
    }

    thumbnailBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.index, 10);
            if (!isNaN(idx)) updateSlide(idx);
        });
    });

        function showLuxuryToast(message, iconClass = 'bi-check-circle-fill text-warning') {
        let container = document.getElementById('luxuryToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'luxuryToastContainer';
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1100';
            document.body.appendChild(container);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-white bg-dark border-0 shadow-lg show mb-2';
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass} fs-5"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>
            </div>
        `;
        container.appendChild(toastEl);

        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 400);
        }, 4000);
    }

        const btnCopyLink = document.getElementById('btnCopyRoomLink');
    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', function () {
            const url = window.location.href;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url).then(() => {
                    showLuxuryToast('Đã sao chép liên kết phòng.');
                }).catch(() => {
                    fallbackCopyText(url);
                });
            } else {
                fallbackCopyText(url);
            }
        });
    }

    function fallbackCopyText(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
            showLuxuryToast('Đã sao chép liên kết phòng.');
        } catch (err) {
            showLuxuryToast('Không thể sao chép tự động. Quý khách vui lòng copy URL trên thanh địa chỉ.', 'bi-info-circle text-info');
        }
    }

    // Lưu và đồng bộ danh sách phòng yêu thích qua localStorage
    const btnSaveRoom = document.getElementById('btnSaveRoom');
    const saveRoomIcon = document.getElementById('saveRoomIcon');
    const saveRoomText = document.getElementById('saveRoomText');
    const STORAGE_KEY = 'grand_luxury_saved_rooms';

    function getSavedRooms() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    function isRoomSaved(id) {
        const saved = getSavedRooms();
        return saved.includes(String(id));
    }

    function updateSaveButtonState() {
        const saved = isRoomSaved(roomId);
        if (saveRoomIcon) {
            if (saved) {
                saveRoomIcon.className = 'bi bi-heart-fill text-danger';
                if (saveRoomText) saveRoomText.textContent = 'Đã lưu phòng';
            } else {
                saveRoomIcon.className = 'bi bi-heart';
                if (saveRoomText) saveRoomText.textContent = 'Lưu phòng';
            }
        }
    }

    if (btnSaveRoom) {
        updateSaveButtonState();
        btnSaveRoom.addEventListener('click', function () {
            let saved = getSavedRooms();
            const idStr = String(roomId);
            if (saved.includes(idStr)) {
                saved = saved.filter(item => item !== idStr);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                updateSaveButtonState();
                showLuxuryToast('Đã xóa phòng khỏi danh sách lưu trên trình duyệt.', 'bi-heartbreak text-muted');
            } else {
                saved.push(idStr);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                updateSaveButtonState();
                showLuxuryToast('Đã lưu phòng vào danh sách yêu thích trên trình duyệt này.');
            }
        });
    }

        const btnScrollTop = document.getElementById('btnScrollTop');
    if (btnScrollTop) {
        btnScrollTop.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const subnavLinks = document.querySelectorAll('.sticky-subnav-link[href^="#"]');
    const sections = Array.from(subnavLinks).map(link => {
        const targetId = link.getAttribute('href').substring(1);
        return document.getElementById(targetId);
    }).filter(sec => sec !== null);

    window.addEventListener('scroll', function () {
        const scrollPos = window.scrollY + 140;
        let currentSecId = '';

        sections.forEach(sec => {
            if (sec.offsetTop <= scrollPos) {
                currentSecId = sec.id;
            }
        });

        subnavLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentSecId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    });

        const stickyQuickbar = document.getElementById('stickyQuickbar');
    const heroOverviewSection = document.getElementById('sec-tong-quan');

    if (stickyQuickbar && heroOverviewSection) {
        window.addEventListener('scroll', function () {
            const triggerPoint = heroOverviewSection.offsetTop + 100;
            if (window.scrollY > triggerPoint) {
                stickyQuickbar.classList.add('visible');
            } else {
                stickyQuickbar.classList.remove('visible');
            }
        });
    }

        const btnToggleAmenities = document.getElementById('btnToggleAmenities');
    const extraAmenitiesContainer = document.getElementById('extraAmenitiesContainer');

    if (btnToggleAmenities && extraAmenitiesContainer) {
        btnToggleAmenities.addEventListener('click', function () {
            const isHidden = extraAmenitiesContainer.classList.contains('d-none');
            if (isHidden) {
                extraAmenitiesContainer.classList.remove('d-none');
                btnToggleAmenities.innerHTML = '<span>Thu gọn bớt tiện ích</span><i class="bi bi-chevron-up ms-1"></i>';
            } else {
                extraAmenitiesContainer.classList.add('d-none');
                btnToggleAmenities.innerHTML = '<span>Xem toàn bộ tiện ích &amp; dịch vụ</span><i class="bi bi-chevron-down ms-1"></i>';
            }
        });
    }

        const helpfulBtns = document.querySelectorAll('.btn-helpful');
    const HELPFUL_STORAGE_KEY = 'grand_luxury_helpful_reviews';

    function getHelpfulVotes() {
        try {
            const votes = localStorage.getItem(HELPFUL_STORAGE_KEY);
            return votes ? JSON.parse(votes) : [];
        } catch (e) {
            return [];
        }
    }

    function initHelpfulButtons() {
        const voted = getHelpfulVotes();
        helpfulBtns.forEach(btn => {
            const revId = btn.dataset.reviewId;
            if (voted.includes(revId)) {
                btn.classList.add('btn-dark');
                btn.classList.remove('btn-outline-secondary');
                btn.disabled = true;
                const textSpan = btn.querySelector('.helpful-text');
                if (textSpan) textSpan.textContent = 'Đã cảm ơn';
            }
        });
    }

    initHelpfulButtons();

    helpfulBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const revId = this.dataset.reviewId;
            let voted = getHelpfulVotes();
            if (!voted.includes(revId)) {
                voted.push(revId);
                localStorage.setItem(HELPFUL_STORAGE_KEY, JSON.stringify(voted));
                
                const countSpan = this.querySelector('.helpful-count');
                if (countSpan) {
                    let currentCount = parseInt(countSpan.textContent, 10) || 0;
                    countSpan.textContent = currentCount + 1;
                }

                this.classList.add('btn-dark');
                this.classList.remove('btn-outline-secondary');
                this.disabled = true;

                const textSpan = this.querySelector('.helpful-text');
                if (textSpan) textSpan.textContent = 'Đã cảm ơn';

                showLuxuryToast('Cảm ơn quý khách đã phản hồi đánh giá hữu ích.');
            }
        });
    });
});
