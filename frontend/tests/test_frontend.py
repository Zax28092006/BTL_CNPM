import os
import sys
import unittest
from datetime import datetime, date, timedelta

# Them thu muc frontend vao path de import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, DS_NGUOI_DUNG, DS_PHONG, DS_PHIEU_THUE, DS_HOA_DON, DS_PHIEU_DAT, tinh_tien_phong, tao_hoa_don

class FrontendProjectTestSuite(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()

    # ========================================================
    # 1. KIEM TRA ROUTE 404
    # ========================================================
    def test_room_detail_404_on_invalid_id(self):
        """Kiem tra tra ve 404 khi truy cap phong khong ton tai"""
        response = self.client.get('/phong/999')
        self.assertEqual(response.status_code, 404)

    def test_booking_get_404_on_invalid_id(self):
        """Kiem tra tra ve 404 khi vao trang dat phong voi ID khong ton tai"""
        response = self.client.get('/dat-phong/999')
        self.assertEqual(response.status_code, 404)

    def test_booking_get_redirect_on_maintenance_room(self):
        """Kiem tra chan dat phong khi phong dang o trang thai BAO_TRI"""
        # Phong 103 dang BAO_TRI
        response = self.client.get('/dat-phong/103')
        self.assertEqual(response.status_code, 302)
        self.assertTrue('/#danh-sach-phong' in response.headers.get('Location', ''))

    # ========================================================
    # 2. PHAN QUYEN TRUY CAP 4 VAI TRO (RBAC)
    # ========================================================
    def test_guest_cannot_access_admin_or_staff(self):
        """Khach vang lai khong the vao trang quan tri hoac thu ngan"""
        res_admin = self.client.get('/admin/phong')
        self.assertEqual(res_admin.status_code, 302)
        self.assertTrue('/login' in res_admin.headers.get('Location', ''))

        res_staff = self.client.get('/nhan-vien/thanh-toan')
        self.assertEqual(res_staff.status_code, 302)
        self.assertTrue('/login' in res_staff.headers.get('Location', ''))

    def test_customer_role_permissions(self):
        """Khach hang chi xem duoc trang cua minh, khong vao duoc admin"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 3, 'username': 'khachhang', 'ho_ten': 'Nguyễn Văn An', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 3

        # Khach hang duoc phep vao danh sach phieu thue
        res_rentals = self.client.get('/phieu-thue')
        self.assertEqual(res_rentals.status_code, 200)

        # Khach hang bi chan khoi trang quan tri phong
        res_admin = self.client.get('/admin/phong')
        self.assertEqual(res_admin.status_code, 302)
        self.assertTrue(res_admin.headers.get('Location') in ['/', 'http://localhost/'])

    def test_staff_role_permissions(self):
        """Nhan vien thu ngan vao duoc trang thanh toan nhung khong vao duoc admin"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 2, 'username': 'nv_thungan', 'ho_ten': 'Lê Thu Ngân', 'vai_tro': 'NHAN_VIEN'}
            sess['user_id'] = 2

        res_staff = self.client.get('/nhan-vien/thanh-toan')
        self.assertEqual(res_staff.status_code, 200)

        res_admin = self.client.get('/admin/phong')
        self.assertEqual(res_admin.status_code, 302)

    def test_admin_role_permissions(self):
        """Quan tri vien co toan quyen vao admin, bao cao va khuyen mai"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 1, 'username': 'admin', 'ho_ten': 'Quản Trị Viên', 'vai_tro': 'QUAN_TRI'}
            sess['user_id'] = 1

        self.assertEqual(self.client.get('/admin/phong').status_code, 200)
        self.assertEqual(self.client.get('/admin/khuyen-mai').status_code, 200)
        self.assertEqual(self.client.get('/admin/bao-cao-doanh-thu').status_code, 200)
        self.assertEqual(self.client.get('/admin/bao-cao-mat-do').status_code, 200)

    # ========================================================
    # 3. CHONG IDOR (INSECURE DIRECT OBJECT REFERENCES)
    # ========================================================
    def test_idor_customer_cannot_view_other_rental(self):
        """Khach hang A khong duoc xem hoac thanh toan phieu thue cua Khach hang B"""
        with self.client.session_transaction() as sess:
            # Dang nhap voi user_id = 3 (chi so huu PT001)
            sess['user'] = {'id': 3, 'username': 'khachhang', 'ho_ten': 'Nguyễn Văn An', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 3

        # PT002 thuoc ve user_id = 4
        res_checkout = self.client.get('/thanh-toan/PT002')
        self.assertEqual(res_checkout.status_code, 302)
        self.assertTrue('/phieu-thue' in res_checkout.headers.get('Location', ''))

    def test_idor_customer_cannot_confirm_other_payment(self):
        """Khach hang khong the POST thanh toan cho phieu cua nguoi khac"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 3, 'username': 'khachhang', 'ho_ten': 'Nguyễn Văn An', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 3

        # Gui POST xac nhan thanh toan PT002
        res = self.client.post('/thanh-toan/xac-nhan/PT002', data={'ket_qua': 'thanh_cong'})
        self.assertEqual(res.status_code, 302)
        self.assertTrue('/phieu-thue' in res.headers.get('Location', ''))

    def test_idor_customer_cannot_view_other_invoice(self):
        """Khach hang khong the xem hoa don cua nguoi khac"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 3, 'username': 'khachhang', 'ho_ten': 'Nguyễn Văn An', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 3

        # HD0001 thuoc ve user_id = 6
        res = self.client.get('/hoa-don/HD0001')
        self.assertEqual(res.status_code, 302)
        self.assertTrue('/phieu-thue' in res.headers.get('Location', ''))

    # ========================================================
    # 4. KIEM TRA CSRF TOKEN
    # ========================================================
    def test_csrf_token_validation_in_production_mode(self):
        """Kiem tra chan POST request neu khong co CSRF token khi chay that (TESTING=False)"""
        app.config['TESTING'] = False
        client = app.test_client()

        # POST khong co token se bi 400
        res = client.post('/login', data={'username': 'admin', 'password': '123'})
        self.assertEqual(res.status_code, 400)

        # Lay token hop le tu session
        with client.session_transaction() as sess:
            sess['_csrf_token'] = 'valid_token_12345'

        res_valid = client.post('/login', data={'username': 'admin', 'password': 'wrong_password', 'csrf_token': 'valid_token_12345'})
        # Duoc di tiep vao view va xu ly xac thuc (tra ve 200 voi form login va flash loi)
        self.assertEqual(res_valid.status_code, 200)

        app.config['TESTING'] = True

    # ========================================================
    # 5. VALIDATE DU LIEU DAU VAO
    # ========================================================
    def test_register_input_validation(self):
        """Validate dang ky: mat khau ngan, dinh dang email sai, username trung"""
        # Mat khau duoi 8 ky tu
        res_short_pw = self.client.post('/register', data={
            'ho_ten': 'Test User',
            'username': 'newuser1',
            'cccd': '012345678912',
            'dien_thoai': '0901234567',
            'email': 'test@gmail.com',
            'password': '123',
            'confirm_password': '123'
        })
        self.assertEqual(res_short_pw.status_code, 200)
        self.assertIn('tối thiểu 8 ký tự', res_short_pw.data.decode('utf-8'))

        # Email sai dinh dang
        res_bad_email = self.client.post('/register', data={
            'ho_ten': 'Test User',
            'username': 'newuser2',
            'cccd': '012345678912',
            'dien_thoai': '0901234567',
            'email': 'bad_email_format',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        self.assertEqual(res_bad_email.status_code, 200)
        self.assertIn('email không hợp lệ', res_bad_email.data.decode('utf-8'))

        # Username da ton tai (khong phan biet hoa thuong: ADMIN)
        res_dup_user = self.client.post('/register', data={
            'ho_ten': 'Test User',
            'username': 'ADMIN',
            'cccd': '012345678912',
            'dien_thoai': '0901234567',
            'email': 'test@gmail.com',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        self.assertEqual(res_dup_user.status_code, 200)
        self.assertIn('Tên đăng nhập đã được sử dụng', res_dup_user.data.decode('utf-8'))

    def test_booking_input_validation(self):
        """Validate dat phong: ngay qua khu, ngay tra <= ngay nhan, so khach > 3"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 3, 'username': 'khachhang', 'ho_ten': 'Nguyễn Văn An', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 3

        past_date = (date.today() - timedelta(days=2)).strftime('%Y-%m-%d')
        future_date = (date.today() + timedelta(days=2)).strftime('%Y-%m-%d')

        # 1. Ngay nhan o qua khu
        res_past = self.client.post('/dat-phong/102', data={
            'room_id': 102,
            'checkin_date': past_date,
            'checkout_date': future_date,
            'guest_count': 2
        })
        self.assertEqual(res_past.status_code, 302)

        # 2. Ngay tra truoc hoac bang ngay nhan
        today_str = date.today().strftime('%Y-%m-%d')
        res_inv_dates = self.client.post('/dat-phong/102', data={
            'room_id': 102,
            'checkin_date': today_str,
            'checkout_date': today_str,
            'guest_count': 2
        })
        self.assertEqual(res_inv_dates.status_code, 302)

        # 3. So khach vuot qua 3
        res_too_many_guests = self.client.post('/dat-phong/102', data={
            'room_id': 102,
            'checkin_date': today_str,
            'checkout_date': future_date,
            'guest_count': 4
        })
        self.assertEqual(res_too_many_guests.status_code, 302)

    def test_admin_room_validation(self):
        """Validate them va sua phong: chan ten rong, loai phong la, chan doi phong DANG_THUE sang TRONG"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 1, 'username': 'admin', 'ho_ten': 'Quản Trị Viên', 'vai_tro': 'QUAN_TRI'}
            sess['user_id'] = 1

        # Them phong ten rong
        res_empty = self.client.post('/admin/phong/them', data={'ten_phong': '', 'loai_phong': 'A', 'don_gia': 2000000})
        self.assertEqual(res_empty.status_code, 302)

        # Them phong loai phong la
        res_invalid_type = self.client.post('/admin/phong/them', data={'ten_phong': 'Phòng 505', 'loai_phong': 'VIP', 'don_gia': 2000000})
        self.assertEqual(res_invalid_type.status_code, 302)

        # Sua phong 101 (dang co phieu PT001 chua thanh toan) sang TRONG -> bi chan
        res_switch = self.client.post('/admin/phong/sua', data={
            'id': 101,
            'ten_phong': 'Phòng 101',
            'loai_phong': 'A',
            'don_gia': 2500000,
            'tinh_trang': 'TRONG'
        })
        self.assertEqual(res_switch.status_code, 302)
        # Tinh trang phong 101 khong bi doi thanh TRONG
        p101 = next(p for p in DS_PHONG if p['id'] == 101)
        self.assertEqual(p101['tinh_trang'], 'DANG_THUE')

    # ========================================================
    # 6. CHONG THANH TOAN TRUNG & TOAN VEN HOA DON
    # ========================================================
    def test_duplicate_payment_prevention(self):
        """Kiem tra phieu da thanh toan khong the thanh toan lan 2"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 6, 'username': 'khach6', 'ho_ten': 'Trần Đức Minh', 'vai_tro': 'KHACH_HANG'}
            sess['user_id'] = 6

        # PT004 da thanh toan
        res = self.client.post('/thanh-toan/xac-nhan/PT004', data={'ket_qua': 'thanh_cong'})
        self.assertEqual(res.status_code, 302)
        self.assertTrue('/hoa-don/HD0001' in res.headers.get('Location', ''))

    def test_tao_hoa_don_integrity(self):
        """Ham tao_hoa_don khong bao gio tao trung hoa don cho cung 1 ma phieu"""
        phieu = next(pt for pt in DS_PHIEU_THUE if pt['ma_phieu'] == 'PT004')
        hd1 = tao_hoa_don(phieu)
        hd2 = tao_hoa_don(phieu)
        self.assertEqual(hd1['ma_hoa_don'], hd2['ma_hoa_don'])

    # ========================================================
    # 7. CHUAN HOA CONG THUC TINH TIEN (4 TRUONG HOP)
    # ========================================================
    def test_pricing_case_1_base_standard(self):
        """Case 1: 2 khach noi dia, khong phu thu, he so 1.0"""
        phieu = {
            'don_gia': 1000000,
            'so_ngay': 2,
            'ds_khach': [
                {'stt': 1, 'ho_ten': 'Khách A', 'loai_khach': 'NOI_DIA'},
                {'stt': 2, 'ho_ten': 'Khách B', 'loai_khach': 'NOI_DIA'}
            ]
        }
        res = tinh_tien_phong(phieu)
        self.assertEqual(res['tien_co_ban'], 2000000)
        self.assertFalse(res['co_phu_thu'])
        self.assertEqual(res['tien_phu_thu'], 0)
        self.assertEqual(res['he_so'], 1.0)
        self.assertEqual(res['tong_tien'], 2000000)

    def test_pricing_case_2_third_guest_surcharge(self):
        """Case 2: 3 khach noi dia -> Phu thu 25%"""
        phieu = {
            'don_gia': 1000000,
            'so_ngay': 2,
            'ds_khach': [
                {'stt': 1, 'ho_ten': 'Khách A', 'loai_khach': 'NOI_DIA'},
                {'stt': 2, 'ho_ten': 'Khách B', 'loai_khach': 'NOI_DIA'},
                {'stt': 3, 'ho_ten': 'Khách C', 'loai_khach': 'NOI_DIA'}
            ]
        }
        res = tinh_tien_phong(phieu)
        self.assertEqual(res['tien_co_ban'], 2000000)
        self.assertTrue(res['co_phu_thu'])
        self.assertEqual(res['tien_phu_thu'], 500000)  # 25% cua 2,000,000
        self.assertEqual(res['he_so'], 1.0)
        self.assertEqual(res['tong_tien'], 2500000)

    def test_pricing_case_3_foreign_guest_multiplier(self):
        """Case 3: 2 khach co 1 khach nuoc ngoai -> He so 1.5, khong phu thu 3 khach"""
        phieu = {
            'don_gia': 1000000,
            'so_ngay': 2,
            'ds_khach': [
                {'stt': 1, 'ho_ten': 'Khách A', 'loai_khach': 'NOI_DIA'},
                {'stt': 2, 'ho_ten': 'John Doe', 'loai_khach': 'NUOC_NGOAI'}
            ]
        }
        res = tinh_tien_phong(phieu)
        self.assertEqual(res['tien_co_ban'], 2000000)
        self.assertFalse(res['co_phu_thu'])
        self.assertEqual(res['tien_phu_thu'], 0)
        self.assertEqual(res['he_so'], 1.5)
        self.assertEqual(res['tong_tien'], 3000000)  # 2,000,000 * 1.5

    def test_pricing_case_4_both_surcharge_and_foreign(self):
        """Case 4: 3 khach gom khach nuoc ngoai -> Phu thu 25% va he so 1.5"""
        phieu = {
            'don_gia': 2500000,
            'so_ngay': 3,
            'ds_khach': [
                {'stt': 1, 'ho_ten': 'Khách A', 'loai_khach': 'NOI_DIA'},
                {'stt': 2, 'ho_ten': 'Khách B', 'loai_khach': 'NOI_DIA'},
                {'stt': 3, 'ho_ten': 'John Smith', 'loai_khach': 'NUOC_NGOAI'}
            ]
        }
        res = tinh_tien_phong(phieu)
        # Tien co ban = 2,500,000 * 3 = 7,500,000
        self.assertEqual(res['tien_co_ban'], 7500000)
        self.assertTrue(res['co_phu_thu'])
        # Phu thu 25% = 1,875,000
        self.assertEqual(res['tien_phu_thu'], 1875000)
        self.assertEqual(res['he_so'], 1.5)
        # Tong tien = (7,500,000 + 1,875,000) * 1.5 = 9,375,000 * 1.5 = 14,062,500
        self.assertEqual(res['tong_tien'], 14062500)

    # ========================================================
    # 8. TINH KHOP BAO CAO THEO THANG
    # ========================================================
    def test_monthly_reports_consistency(self):
        """Kiem tra tinh nhat quan va an toan cua bao cao thang 11/2026"""
        with self.client.session_transaction() as sess:
            sess['user'] = {'id': 1, 'username': 'admin', 'ho_ten': 'Quản Trị Viên', 'vai_tro': 'QUAN_TRI'}
            sess['user_id'] = 1

        res_rev = self.client.get('/admin/bao-cao-doanh-thu?thang=11&nam=2026')
        self.assertEqual(res_rev.status_code, 200)

        res_den = self.client.get('/admin/bao-cao-mat-do?thang=11&nam=2026')
        self.assertEqual(res_den.status_code, 200)

        # Kiem tra validate thang khong hop le (thang 13 -> fallback thang 11)
        res_inv_month = self.client.get('/admin/bao-cao-doanh-thu?thang=13&nam=2026')
        self.assertEqual(res_inv_month.status_code, 200)

if __name__ == '__main__':
    unittest.main()
