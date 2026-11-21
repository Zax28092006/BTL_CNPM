/**
 * Quản lý danh mục phòng khách sạn - Khu vực quản trị
 * Đồng bộ giá niêm yết theo loại phòng, điền dữ liệu modal chỉnh sửa,
 * và cảnh báo khi xóa phòng đang có khách thuê.
 */

const BANG_GIA = {
    'A': 2500000,
    'B': 1500000,
    'C': 900000
};

document.addEventListener('DOMContentLoaded', function () {
        function bindRoomTypeToPrice(selectId, inputId) {
        const select = document.getElementById(selectId);
        const input = document.getElementById(inputId);
        if (select && input) {
            select.addEventListener('change', function () {
                if (BANG_GIA[this.value]) {
                    input.value = BANG_GIA[this.value];
                }
            });
        }
    }
    bindRoomTypeToPrice('add_loai_phong', 'add_don_gia');
    bindRoomTypeToPrice('edit_loai_phong', 'edit_don_gia');

        const editButtons = document.querySelectorAll('.btn-edit-room');
    editButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.getElementById('edit_id').value = this.dataset.id;
            document.getElementById('edit_ten_phong').value = this.dataset.ten;
            document.getElementById('edit_loai_phong').value = this.dataset.loai;
            document.getElementById('edit_don_gia').value = this.dataset.dongia;
            document.getElementById('edit_tinh_trang').value = this.dataset.tinhtrang;
            document.getElementById('edit_ghi_chu').value = this.dataset.ghichu || '';
        });
    });

    // Cập nhật modal xác nhận và chặn xóa đối với phòng đang có khách thuê
    const deleteButtons = document.querySelectorAll('.btn-delete-room');
    const deleteForm = document.getElementById('deleteRoomForm');
    const deleteRoomName = document.getElementById('deleteRoomName');
    const deleteWarning = document.getElementById('deleteOccupiedWarning');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

    deleteButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (deleteRoomName) {
                deleteRoomName.textContent = this.dataset.ten;
            }
            if (deleteForm) {
                deleteForm.action = `/admin/phong/xoa/${this.dataset.id}`;
            }
            if (deleteWarning && deleteConfirmBtn) {
                const isOccupied = (this.dataset.tinhtrang === 'DANG_THUE');
                deleteWarning.classList.toggle('d-none', !isOccupied);
                deleteConfirmBtn.disabled = isOccupied;
                deleteConfirmBtn.title = isOccupied ? 'Không thể xóa phòng đang có khách thuê' : '';
            }
        });
    });
});
