import os
import secrets
import re
from datetime import datetime, date
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, abort, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Cau hinh bao mat co ban
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(24))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# TODO: Backend se tich hop he quan tri CSDL MySQL va ORM tai day
# Du lieu mau nguoi dung voi mat khau duoc bam bang werkzeug.security
DS_NGUOI_DUNG = [
    {
        'id': 1,
        'username': 'admin',
        'password': generate_password_hash('admin123'),
        'ho_ten': 'Quản Trị Viên Hệ Thống',
        'vai_tro': 'QUAN_TRI',
        'email': 'admin@grandluxury.vn',
        'dien_thoai': '0901000001'
    },
    {
        'id': 2,
        'username': 'nv_thungan',
        'password': generate_password_hash('123456'),
        'ho_ten': 'Lê Thu Ngân',
        'ma_nv': 'NV01',
        'vai_tro': 'NHAN_VIEN',
        'email': 'thungan@grandluxury.vn',
        'dien_thoai': '0902000002'
    },
    {
        'id': 3,
        'username': 'khachhang',
        'password': generate_password_hash('123456'),
        'ho_ten': 'Nguyễn Văn An',
        'cccd': '079203001234',
        'vai_tro': 'KHACH_HANG',
        'email': 'an.nguyen@gmail.com',
        'dien_thoai': '0903000003'
    }
]

# TODO: Backend thay the bang bang loai_phong trong MySQL
DS_LOAI_PHONG = [
    {'id': 'A', 'ten_loai': 'Phòng Loại A', 'don_gia': 2500000, 'mo_ta': 'Suite cao cấp, view skyline thành phố hoặc biển'},
    {'id': 'B', 'ten_loai': 'Phòng Loại B', 'don_gia': 1500000, 'mo_ta': 'Deluxe sang trọng, ban công thoáng đãng'},
    {'id': 'C', 'ten_loai': 'Phòng Loại C', 'don_gia': 900000, 'mo_ta': 'Standard tiêu chuẩn, ấm cúng và tiện nghi'}
]

# TODO: Backend thay the bang bang phong trong MySQL
DS_PHONG = [
    {
        'id': 101,
        'ten_phong': 'Phòng 101',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'tinh_trang': 'DANG_THUE',
        'ghi_chu': 'Penthouse Tổng thống sang trọng với phòng thay đồ walk-in',
        'anh_chinh': 'phong_101.jpg',
        'danh_sach_anh': ['phong_101.jpg', 'phong_102.jpg', 'phong_103.jpg'],
        'dien_tich': 58,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Phòng thay đồ walk-in', 'Sofa uốn cong thư giãn', 'Bàn trang điểm led', 'Smart TV 65"', 'Minibar cao cấp']
    },
    {
        'id': 102,
        'ten_phong': 'Phòng 102',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'tinh_trang': 'TRONG',
        'ghi_chu': 'Phòng Master tối giản ấm áp với bồn tắm đá marble lộ thiên',
        'anh_chinh': 'phong_102.jpg',
        'danh_sach_anh': ['phong_102.jpg', 'phong_101.jpg', 'phong_103.jpg'],
        'dien_tich': 52,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Bồn tắm marble lộ thiên', 'Giường King Size', 'Loa Bluetooth Marshall', 'Nespresso Coffee', 'View thành phố']
    },
    {
        'id': 103,
        'ten_phong': 'Phòng 103',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'tinh_trang': 'BAO_TRI',
        'ghi_chu': 'Sky Suite tầng cao với vách đá cẩm thạch và sofa cong',
        'anh_chinh': 'phong_103.jpg',
        'danh_sach_anh': ['phong_103.jpg', 'phong_101.jpg', 'phong_102.jpg'],
        'dien_tich': 55,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Vách ngăn TV đá cẩm thạch', 'Sofa cong màu kem', 'Cửa kính panorama 360 độ', 'Bồn sục Jacuzzi']
    },
    {
        'id': 201,
        'ten_phong': 'Phòng 201',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'tinh_trang': 'DANG_THUE',
        'ghi_chu': 'Phòng Suite view skyline thành phố đón bình minh',
        'anh_chinh': 'phong_201.jpg',
        'danh_sach_anh': ['phong_201.jpg', 'phong_202.jpg', 'phong_203.jpg'],
        'dien_tich': 45,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Cửa kính lớn hướng phố', 'Vách lam gỗ ấm cúng', 'Bàn làm việc cao cấp', 'Buffet sáng miễn phí']
    },
    {
        'id': 202,
        'ten_phong': 'Phòng 202',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'tinh_trang': 'TRONG',
        'ghi_chu': 'Phòng hoàng gia tân cổ điển tông xanh navy quý phái',
        'anh_chinh': 'phong_202.jpg',
        'danh_sach_anh': ['phong_202.jpg', 'phong_201.jpg', 'phong_203.jpg'],
        'dien_tich': 46,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Giường tròn hoàng gia', 'Đèn chùm giọt pha lê', 'Rượu vang chào mừng', 'Phòng tắm kính cao cấp']
    },
    {
        'id': 203,
        'ten_phong': 'Phòng 203',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'tinh_trang': 'TRONG',
        'ghi_chu': 'Phòng tân hôn ngọt ngào lãng mạn tông kem hồng pastel',
        'anh_chinh': 'phong_203.jpg',
        'danh_sach_anh': ['phong_203.jpg', 'phong_201.jpg', 'phong_202.jpg'],
        'dien_tich': 42,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Giường vỏ sò rèm voan led', 'Bàn trang điểm đèn tròn', 'Hoa tươi & nến thơm', 'Setup honeymoon riêng']
    },
    {
        'id': 301,
        'ten_phong': 'Phòng 301',
        'loai_phong': 'C',
        'don_gia': 900000,
        'tinh_trang': 'DANG_THUE',
        'ghi_chu': 'Phòng tiêu chuẩn ban công thoáng đãng đón gió biển',
        'anh_chinh': 'phong_301.jpg',
        'danh_sach_anh': ['phong_301.jpg', 'phong_302.jpg', 'phong_201.jpg'],
        'dien_tich': 35,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Ban công view biển', 'Điều hòa 2 chiều', 'Trà & cà phê miễn phí', 'Wifi tốc độ cao']
    },
    {
        'id': 302,
        'ten_phong': 'Phòng 302',
        'loai_phong': 'C',
        'don_gia': 900000,
        'tinh_trang': 'TRONG',
        'ghi_chu': 'Phòng phong cách resort biển Địa Trung Hải tươi sáng',
        'anh_chinh': 'phong_302.jpg',
        'danh_sach_anh': ['phong_302.jpg', 'phong_301.jpg', 'phong_201.jpg'],
        'dien_tich': 36,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Cửa lùa ra hiên biển', 'Ghế đôn thư giãn', 'Smart TV 43"', 'Két sắt điện tử']
    }
]

# TODO: Backend thay the bang bang phieu_thue_phong trong MySQL
# Cac phieu chua thanh toan khong gan hoa don san trong du lieu seed
DS_PHIEU_THUE = [
    {
        'ma_phieu': 'PT001',
        'phong_id': 101,
        'ten_phong': 'Phòng 101',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'khach_hang_id': 3,
        'nguoi_lap': 'Nguyễn Văn An',
        'ngay_nhan': '18/11/2026',
        'ngay_tra': '21/11/2026',
        'so_ngay': 3,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'CHUA_THANH_TOAN',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Nguyễn Văn An', 'loai_khach': 'NOI_DIA', 'cmnd': '079203001234', 'dia_chi': 'TP. Hồ Chí Minh'},
            {'stt': 2, 'ho_ten': 'Trần Thị Mai', 'loai_khach': 'NOI_DIA', 'cmnd': '079203005678', 'dia_chi': 'Bình Dương'},
            {'stt': 3, 'ho_ten': 'John Smith', 'loai_khach': 'NUOC_NGOAI', 'cmnd': 'P987654321', 'dia_chi': 'California, USA'}
        ]
    },
    {
        'ma_phieu': 'PT002',
        'phong_id': 201,
        'ten_phong': 'Phòng 201',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'khach_hang_id': 4,
        'nguoi_lap': 'Lê Văn Bình',
        'ngay_nhan': '19/11/2026',
        'ngay_tra': '21/11/2026',
        'so_ngay': 2,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'CHUA_THANH_TOAN',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Lê Văn Bình', 'loai_khach': 'NOI_DIA', 'cmnd': '072201009876', 'dia_chi': 'Đà Nẵng'},
            {'stt': 2, 'ho_ten': 'Phạm Thu Thảo', 'loai_khach': 'NOI_DIA', 'cmnd': '072201004321', 'dia_chi': 'Quảng Nam'}
        ]
    },
    {
        'ma_phieu': 'PT003',
        'phong_id': 301,
        'ten_phong': 'Phòng 301',
        'loai_phong': 'C',
        'don_gia': 900000,
        'khach_hang_id': 5,
        'nguoi_lap': 'David Miller',
        'ngay_nhan': '19/11/2026',
        'ngay_tra': '21/11/2026',
        'so_ngay': 2,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'CHUA_THANH_TOAN',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'David Miller', 'loai_khach': 'NUOC_NGOAI', 'cmnd': 'B12345678', 'dia_chi': 'London, UK'},
            {'stt': 2, 'ho_ten': 'Nguyễn Hoàng Long', 'loai_khach': 'NOI_DIA', 'cmnd': '079201001122', 'dia_chi': 'Hà Nội'},
            {'stt': 3, 'ho_ten': 'Vũ Thị Hạnh', 'loai_khach': 'NOI_DIA', 'cmnd': '079201003344', 'dia_chi': 'Hải Phòng'}
        ]
    },
    {
        'ma_phieu': 'PT004',
        'phong_id': 102,
        'ten_phong': 'Phòng 102',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'khach_hang_id': 6,
        'nguoi_lap': 'Trần Đức Minh',
        'ngay_nhan': '10/11/2026',
        'ngay_tra': '14/11/2026',
        'so_ngay': 4,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'DA_THANH_TOAN',
        'ma_hoa_don': 'HD0001',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Trần Đức Minh', 'loai_khach': 'NOI_DIA', 'cmnd': '001201005566', 'dia_chi': 'Hà Nội'},
            {'stt': 2, 'ho_ten': 'Lê Thu Hương', 'loai_khach': 'NOI_DIA', 'cmnd': '001201007788', 'dia_chi': 'Hà Nội'}
        ]
    },
    {
        'ma_phieu': 'PT005',
        'phong_id': 202,
        'ten_phong': 'Phòng 202',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'khach_hang_id': 7,
        'nguoi_lap': 'Võ Thị Thanh',
        'ngay_nhan': '12/11/2026',
        'ngay_tra': '15/11/2026',
        'so_ngay': 3,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'DA_THANH_TOAN',
        'ma_hoa_don': 'HD0002',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Võ Thị Thanh', 'loai_khach': 'NOI_DIA', 'cmnd': '079202009988', 'dia_chi': 'Cần Thơ'},
            {'stt': 2, 'ho_ten': 'Đặng Quốc Anh', 'loai_khach': 'NOI_DIA', 'cmnd': '079202001144', 'dia_chi': 'TP. Hồ Chí Minh'}
        ]
    },
    {
        'ma_phieu': 'PT006',
        'phong_id': 302,
        'ten_phong': 'Phòng 302',
        'loai_phong': 'C',
        'don_gia': 900000,
        'khach_hang_id': 8,
        'nguoi_lap': 'Hoàng Văn Cường',
        'ngay_nhan': '02/11/2026',
        'ngay_tra': '05/11/2026',
        'so_ngay': 3,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'DA_THANH_TOAN',
        'ma_hoa_don': 'HD0003',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Hoàng Văn Cường', 'loai_khach': 'NOI_DIA', 'cmnd': '036200001234', 'dia_chi': 'Nam Định'},
            {'stt': 2, 'ho_ten': 'Nguyễn Thúy Nga', 'loai_khach': 'NOI_DIA', 'cmnd': '036200005678', 'dia_chi': 'Nam Định'}
        ]
    },
    {
        'ma_phieu': 'PT007',
        'phong_id': 203,
        'ten_phong': 'Phòng 203',
        'loai_phong': 'B',
        'don_gia': 1500000,
        'khach_hang_id': 9,
        'nguoi_lap': 'Phan Minh Tuấn',
        'ngay_nhan': '06/11/2026',
        'ngay_tra': '08/11/2026',
        'so_ngay': 2,
        'thang': 11,
        'nam': 2026,
        'trang_thai': 'DA_THANH_TOAN',
        'ma_hoa_don': 'HD0004',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Phan Minh Tuấn', 'loai_khach': 'NOI_DIA', 'cmnd': '079203004455', 'dia_chi': 'TP. Hồ Chí Minh'},
            {'stt': 2, 'ho_ten': 'Lê Ngọc Mai', 'loai_khach': 'NOI_DIA', 'cmnd': '079203008899', 'dia_chi': 'TP. Hồ Chí Minh'}
        ]
    },
    {
        'ma_phieu': 'PT008',
        'phong_id': 101,
        'ten_phong': 'Phòng 101',
        'loai_phong': 'A',
        'don_gia': 2500000,
        'khach_hang_id': 10,
        'nguoi_lap': 'Trần Văn Bình',
        'ngay_nhan': '12/10/2026',
        'ngay_tra': '15/10/2026',
        'so_ngay': 3,
        'thang': 10,
        'nam': 2026,
        'trang_thai': 'DA_THANH_TOAN',
        'ma_hoa_don': 'HD0005',
        'ds_khach': [
            {'stt': 1, 'ho_ten': 'Trần Văn Bình', 'loai_khach': 'NOI_DIA', 'cmnd': '001201009988', 'dia_chi': 'Hà Nội'},
            {'stt': 2, 'ho_ten': 'Nguyễn Thị Hoa', 'loai_khach': 'NOI_DIA', 'cmnd': '001201007766', 'dia_chi': 'Hà Nội'}
        ]
    }
]

# TODO: Backend thay the bang bang hoa_don trong MySQL
# Du lieu hoa don khop chinh xac voi cac phieu thue da thanh toan
DS_HOA_DON = [
    {
        'ma_hoa_don': 'HD0001',
        'ma_phieu': 'PT004',
        'phong_id': 102,
        'ten_phong': 'Phòng 102',
        'loai_phong': 'A',
        'khach_hang_id': 6,
        'nguoi_lap': 'Trần Đức Minh',
        'ngay_nhan': '10/11/2026',
        'ngay_tra': '14/11/2026',
        'so_ngay': 4,
        'ngay_thanh_toan': '14/11/2026 12:00',
        'phuong_thuc': 'TAI_QUAY',
        'trang_thai': 'DA_THANH_TOAN',
        'thang': 11,
        'nam': 2026,
        'chi_tiet': {
            'tien_co_ban': 10000000,
            'so_khach': 2,
            'co_phu_thu': False,
            'tien_phu_thu': 0,
            'co_khach_nuoc_ngoai': False,
            'he_so': 1.0,
            'tong_tien': 10000000
        }
    },
    {
        'ma_hoa_don': 'HD0002',
        'ma_phieu': 'PT005',
        'phong_id': 202,
        'ten_phong': 'Phòng 202',
        'loai_phong': 'B',
        'khach_hang_id': 7,
        'nguoi_lap': 'Võ Thị Thanh',
        'ngay_nhan': '12/11/2026',
        'ngay_tra': '15/11/2026',
        'so_ngay': 3,
        'ngay_thanh_toan': '15/11/2026 11:30',
        'phuong_thuc': 'TAI_QUAY',
        'trang_thai': 'DA_THANH_TOAN',
        'thang': 11,
        'nam': 2026,
        'chi_tiet': {
            'tien_co_ban': 4500000,
            'so_khach': 2,
            'co_phu_thu': False,
            'tien_phu_thu': 0,
            'co_khach_nuoc_ngoai': False,
            'he_so': 1.0,
            'tong_tien': 4500000
        }
    },
    {
        'ma_hoa_don': 'HD0003',
        'ma_phieu': 'PT006',
        'phong_id': 302,
        'ten_phong': 'Phòng 302',
        'loai_phong': 'C',
        'khach_hang_id': 8,
        'nguoi_lap': 'Hoàng Văn Cường',
        'ngay_nhan': '02/11/2026',
        'ngay_tra': '05/11/2026',
        'so_ngay': 3,
        'ngay_thanh_toan': '05/11/2026 15:45',
        'phuong_thuc': 'TAI_QUAY',
        'trang_thai': 'DA_THANH_TOAN',
        'thang': 11,
        'nam': 2026,
        'chi_tiet': {
            'tien_co_ban': 2700000,
            'so_khach': 2,
            'co_phu_thu': False,
            'tien_phu_thu': 0,
            'co_khach_nuoc_ngoai': False,
            'he_so': 1.0,
            'tong_tien': 2700000
        }
    },
    {
        'ma_hoa_don': 'HD0004',
        'ma_phieu': 'PT007',
        'phong_id': 203,
        'ten_phong': 'Phòng 203',
        'loai_phong': 'B',
        'khach_hang_id': 9,
        'nguoi_lap': 'Phan Minh Tuấn',
        'ngay_nhan': '06/11/2026',
        'ngay_tra': '08/11/2026',
        'so_ngay': 2,
        'ngay_thanh_toan': '08/11/2026 10:00',
        'phuong_thuc': 'ONLINE',
        'trang_thai': 'DA_THANH_TOAN',
        'thang': 11,
        'nam': 2026,
        'chi_tiet': {
            'tien_co_ban': 3000000,
            'so_khach': 2,
            'co_phu_thu': False,
            'tien_phu_thu': 0,
            'co_khach_nuoc_ngoai': False,
            'he_so': 1.0,
            'tong_tien': 3000000
        }
    },
    {
        'ma_hoa_don': 'HD0005',
        'ma_phieu': 'PT008',
        'phong_id': 101,
        'ten_phong': 'Phòng 101',
        'loai_phong': 'A',
        'khach_hang_id': 10,
        'nguoi_lap': 'Trần Văn Bình',
        'ngay_nhan': '12/10/2026',
        'ngay_tra': '15/10/2026',
        'so_ngay': 3,
        'ngay_thanh_toan': '15/10/2026 12:00',
        'phuong_thuc': 'ONLINE',
        'trang_thai': 'DA_THANH_TOAN',
        'thang': 10,
        'nam': 2026,
        'chi_tiet': {
            'tien_co_ban': 7500000,
            'so_khach': 2,
            'co_phu_thu': False,
            'tien_phu_thu': 0,
            'co_khach_nuoc_ngoai': False,
            'he_so': 1.0,
            'tong_tien': 7500000
        }
    }
]

# TODO: Backend se luu tru phieu dat truc tuyen vao MySQL
DS_PHIEU_DAT = []

# ==========================================
# CSRF PROTECTION & SECURITY HEADERS
# ==========================================

@app.before_request
def check_csrf_token():
    if app.config.get('TESTING'):
        return
    if request.method == 'POST':
        token = request.form.get('csrf_token') or request.headers.get('X-CSRFToken')
        expected_token = session.get('_csrf_token')
        if not expected_token or not token or token != expected_token:
            abort(400, description="CSRF token không hợp lệ hoặc phiên làm việc đã hết hạn.")

@app.context_processor
def inject_csrf():
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_hex(16)
    return dict(csrf_token=lambda: session.get('_csrf_token', ''))

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response

# ==========================================
# NGHIEP VU TINH TIEN PHONG & HOA DON
# ==========================================

def tinh_tien_phong(phieu):
    # 1. Tien co ban = Don gia * So ngay thue
    don_gia = phieu.get('don_gia', 0)
    so_ngay = max(1, phieu.get('so_ngay', 1))
    tien_co_ban = don_gia * so_ngay

    # 2. Phu thu 25% neu du 3 khach
    ds_khach = phieu.get('ds_khach', [])
    so_khach = len(ds_khach)
    co_phu_thu = (so_khach >= 3)
    tien_phu_thu = int(tien_co_ban * 0.25) if co_phu_thu else 0

    # 3. He so 1.5 neu co it nhat 1 khach nuoc ngoai
    co_khach_nuoc_ngoai = any(k.get('loai_khach') == 'NUOC_NGOAI' for k in ds_khach)
    he_so = 1.5 if co_khach_nuoc_ngoai else 1.0

    # 4. Tong tien = (Tien co ban + Phu thu) * He so
    tong_tien = int((tien_co_ban + tien_phu_thu) * he_so)

    return {
        'tien_co_ban': tien_co_ban,
        'so_khach': so_khach,
        'co_phu_thu': co_phu_thu,
        'tien_phu_thu': tien_phu_thu,
        'co_khach_nuoc_ngoai': co_khach_nuoc_ngoai,
        'he_so': he_so,
        'tong_tien': tong_tien
    }

def tao_hoa_don(phieu, phuong_thuc='TIEN_MAT'):
    # Chan tao hoa don trung theo ma phieu
    hd_da_co = next((hd for hd in DS_HOA_DON if hd.get('ma_phieu') == phieu.get('ma_phieu')), None)
    if hd_da_co:
        return hd_da_co

    ma_hd = f"HD{len(DS_HOA_DON) + 1:04d}"
    chi_tiet = tinh_tien_phong(phieu)
    now = datetime.now()

    hoa_don = {
        'ma_hoa_don': ma_hd,
        'ma_phieu': phieu['ma_phieu'],
        'phong_id': phieu['phong_id'],
        'ten_phong': phieu['ten_phong'],
        'loai_phong': phieu['loai_phong'],
        'khach_hang_id': phieu.get('khach_hang_id'),
        'nguoi_lap': phieu.get('nguoi_lap', ''),
        'ngay_nhan': phieu.get('ngay_nhan', ''),
        'ngay_tra': phieu.get('ngay_tra', ''),
        'so_ngay': phieu.get('so_ngay', 1),
        'ngay_thanh_toan': now.strftime('%d/%m/%Y %H:%M'),
        'phuong_thuc': phuong_thuc,
        'trang_thai': 'DA_THANH_TOAN',
        'thang': now.month,
        'nam': now.year,
        'chi_tiet': chi_tiet
    }

    DS_HOA_DON.append(hoa_don)
    phieu['trang_thai'] = 'DA_THANH_TOAN'
    phieu['ma_hoa_don'] = ma_hd
    return hoa_don

@app.template_filter('vnd')
def format_vnd(value):
    try:
        return f"{int(value):,} đ".replace(',', '.')
    except (ValueError, TypeError):
        return f"{value} đ"

# ==========================================
# PHAN QUYEN TRUY CAP (RBAC)
# ==========================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Vui lòng đăng nhập để thực hiện chức năng này.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Vui lòng đăng nhập với quyền quản trị viên.', 'warning')
            return redirect(url_for('login'))
        if session['user'].get('vai_tro') != 'QUAN_TRI':
            flash('Bạn không có quyền truy cập khu vực quản trị.', 'danger')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

def staff_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            flash('Vui lòng đăng nhập tài khoản nhân viên.', 'warning')
            return redirect(url_for('login'))
        if session['user'].get('vai_tro') not in ['NHAN_VIEN', 'QUAN_TRI']:
            flash('Chức năng này chỉ dành cho nhân viên khách sạn.', 'danger')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

# ==========================================
# CLIENT ROUTES
# ==========================================

@app.route('/')
def home():
    ds_phong_display = [dict(p) for p in DS_PHONG]
    return render_template(
        'client/home.html',
        ds_phong=ds_phong_display,
        ds_loai_phong=DS_LOAI_PHONG
    )

@app.route('/phong/<int:room_id>')
def room_detail(room_id):
    phong = next((p for p in DS_PHONG if p['id'] == room_id), None)
    if not phong:
        abort(404)

    phong_lien_quan = [p for p in DS_PHONG if p['loai_phong'] == phong['loai_phong'] and p['id'] != room_id][:3]
    return render_template(
        'client/room_detail.html',
        phong=phong,
        phong_lien_quan=phong_lien_quan
    )

@app.route('/dat-phong', methods=['GET', 'POST'])
@app.route('/dat-phong/<int:room_id>', methods=['GET', 'POST'])
def client_booking(room_id=None):
    if room_id is None:
        room_id = request.args.get('room_id', type=int)

    # Xu ly GET request
    if request.method == 'GET':
        phong = None
        if room_id:
            phong = next((p for p in DS_PHONG if p['id'] == room_id), None)
            if not phong:
                abort(404)
            if phong.get('tinh_trang') == 'BAO_TRI':
                flash('Phòng hiện đang bảo trì, quý khách vui lòng chọn phòng khác.', 'warning')
                return redirect(url_for('home') + '#danh-sach-phong')
        else:
            phong = next((p for p in DS_PHONG if p['tinh_trang'] == 'TRONG'), DS_PHONG[0])

        if 'user' in session:
            role = session['user'].get('vai_tro')
            if role == 'QUAN_TRI':
                return redirect(url_for('admin_rooms'))
            elif role == 'NHAN_VIEN':
                return redirect(url_for('staff_payment'))

        ds_phong_trong = [p for p in DS_PHONG if p['tinh_trang'] == 'TRONG']
        return render_template(
            'client/booking.html',
            phong=phong,
            ds_loai_phong=DS_LOAI_PHONG,
            ds_phong_trong=ds_phong_trong,
            ds_phong=DS_PHONG
        )

    # Xu ly POST request
    if 'user' not in session:
        flash('Vui lòng đăng nhập để hoàn tất đặt phòng.', 'warning')
        return redirect(url_for('login'))

    user = session['user']
    target_room_id = request.form.get('room_id', type=int) or room_id
    phong = next((p for p in DS_PHONG if p['id'] == target_room_id), None)
    if not phong:
        abort(404)

    if phong.get('tinh_trang') == 'BAO_TRI':
        flash('Phòng đang trong trạng thái bảo trì, không thể đặt phòng.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    checkin_str = request.form.get('checkin_date', '').strip()
    checkout_str = request.form.get('checkout_date', '').strip()
    guest_count = request.form.get('guest_count', 1, type=int)

    if not checkin_str or not checkout_str:
        flash('Vui lòng chọn ngày nhận phòng và ngày trả phòng.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    try:
        checkin = datetime.strptime(checkin_str, '%Y-%m-%d').date()
        checkout = datetime.strptime(checkout_str, '%Y-%m-%d').date()
    except ValueError:
        flash('Định dạng ngày không hợp lệ.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    today = date.today()
    if checkin < today:
        flash('Ngày nhận phòng không được ở trong quá khứ.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    if checkout <= checkin:
        flash('Ngày trả phòng phải sau ngày nhận phòng.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    duration = (checkout - checkin).days
    if duration > 28:
        flash('Thời gian lưu trú tối đa cho một lượt đặt phòng là 28 ngày.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    if guest_count < 1 or guest_count > 3:
        flash('Số lượng khách mỗi phòng tối đa 3 người theo quy định.', 'danger')
        return redirect(url_for('client_booking', room_id=target_room_id))

    # Tao ban ghi dat phong tam thoi (Mock)
    ma_dat = f"PD{len(DS_PHIEU_DAT) + 1:03d}"
    ban_ghi_dat = {
        'ma_phieu_dat': ma_dat,
        'phong_id': phong['id'],
        'ten_phong': phong['ten_phong'],
        'loai_phong': phong['loai_phong'],
        'khach_hang_id': user.get('id'),
        'nguoi_dat': request.form.get('booker_name', user.get('ho_ten', '')).strip(),
        'dien_thoai': request.form.get('booker_phone', user.get('dien_thoai', '')).strip(),
        'email': request.form.get('booker_email', user.get('email', '')).strip(),
        'ngay_nhan': checkin_str,
        'ngay_tra': checkout_str,
        'so_ngay': duration,
        'so_khach': guest_count,
        'ngay_tao': datetime.now().strftime('%d/%m/%Y %H:%M'),
        'trang_thai': 'CHO_XAC_NHAN'
    }
    DS_PHIEU_DAT.append(ban_ghi_dat)

    flash('Yêu cầu đặt phòng của quý khách đã được ghi nhận thành công! Lễ tân sẽ liên hệ xác nhận trong thời gian sớm nhất.', 'success')
    return redirect(url_for('client_rentals'))

@app.route('/phieu-thue')
@login_required
def client_rentals():
    user = session['user']
    role = user.get('vai_tro')

    if role == 'KHACH_HANG':
        # Kiem tra quyen so huu bang khach_hang_id (chong IDOR)
        ds_phieu = [pt for pt in DS_PHIEU_THUE if pt.get('khach_hang_id') == user.get('id')]
    else:
        ds_phieu = DS_PHIEU_THUE

    ds_phieu_hien_thi = []
    for pt in ds_phieu:
        item = dict(pt)
        calc = tinh_tien_phong(pt)
        item['tinh_tien'] = calc
        item['chi_tiet'] = calc
        ds_phieu_hien_thi.append(item)

    return render_template('payment/list_rentals.html', ds_phieu=ds_phieu_hien_thi)

@app.route('/thanh-toan/<ma_phieu>')
@login_required
def checkout(ma_phieu):
    user = session['user']
    phieu = next((pt for pt in DS_PHIEU_THUE if pt['ma_phieu'] == ma_phieu), None)
    if not phieu:
        abort(404)

    # Kiem tra quyen so huu bang khach_hang_id (chong IDOR)
    if user.get('vai_tro') == 'KHACH_HANG' and phieu.get('khach_hang_id') != user.get('id'):
        flash('Bạn không có quyền truy cập phiếu thuê này.', 'danger')
        return redirect(url_for('client_rentals'))

    if phieu.get('trang_thai') == 'DA_THANH_TOAN':
        flash('Phiếu thuê này đã được thanh toán trước đó.', 'info')
        if phieu.get('ma_hoa_don'):
            return redirect(url_for('invoice_result', ma_hoa_don=phieu['ma_hoa_don']))
        return redirect(url_for('client_rentals'))

    chi_tiet = tinh_tien_phong(phieu)
    return render_template('payment/checkout.html', phieu=phieu, chi_tiet=chi_tiet)

@app.route('/thanh-toan/xac-nhan/<ma_phieu>', methods=['POST'])
@login_required
def confirm_payment(ma_phieu):
    user = session['user']
    if user.get('vai_tro') != 'KHACH_HANG':
        flash('Chức năng này chỉ dành cho khách hàng lưu trú.', 'danger')
        return redirect(url_for('home'))

    phieu = next((pt for pt in DS_PHIEU_THUE if pt['ma_phieu'] == ma_phieu), None)
    if not phieu:
        abort(404)

    # Kiem tra quyen so huu bang khach_hang_id (chong IDOR)
    if phieu.get('khach_hang_id') != user.get('id'):
        flash('Bạn không có quyền thanh toán phiếu thuê này.', 'danger')
        return redirect(url_for('client_rentals'))

    if phieu.get('trang_thai') == 'DA_THANH_TOAN':
        flash('Phiếu thuê này đã được thanh toán.', 'info')
        return redirect(url_for('invoice_result', ma_hoa_don=phieu.get('ma_hoa_don')))

    ket_qua = request.form.get('ket_qua', '')
    if ket_qua != 'thanh_cong':
        flash('Giao dịch thanh toán trực tuyến không thành công. Quý khách vui lòng thử lại.', 'danger')
        return redirect(url_for('checkout', ma_phieu=ma_phieu))

    hoa_don = tao_hoa_don(phieu, phuong_thuc='ONLINE')

    # Chi cap nhat phong ve TRONG neu phong dang DANG_THUE (khong ghi de phong BAO_TRI)
    phong = next((p for p in DS_PHONG if p['id'] == phieu['phong_id']), None)
    if phong and phong.get('tinh_trang') == 'DANG_THUE':
        phong['tinh_trang'] = 'TRONG'

    flash('Thanh toán thành công! Hóa đơn điện tử đã được phát hành.', 'success')
    return redirect(url_for('invoice_result', ma_hoa_don=hoa_don['ma_hoa_don']))

@app.route('/hoa-don/<ma_hoa_don>')
@login_required
def invoice_result(ma_hoa_don):
    hoa_don = next((hd for hd in DS_HOA_DON if hd['ma_hoa_don'] == ma_hoa_don), None)
    if not hoa_don:
        abort(404)

    user = session['user']
    # Kiem tra quyen so huu bang khach_hang_id (chong IDOR)
    if user.get('vai_tro') == 'KHACH_HANG' and hoa_don.get('khach_hang_id') != user.get('id'):
        flash('Bạn không có quyền xem hóa đơn này.', 'danger')
        return redirect(url_for('client_rentals'))

    return render_template('payment/invoice_result.html', hoa_don=hoa_don)

# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        # Tim kiem ten dang nhap khong phan biet chu hoa, chu thuong
        user = next((u for u in DS_NGUOI_DUNG if u['username'].lower() == username.lower()), None)

        if user and check_password_hash(user['password'], password):
            session['user'] = {
                'id': user['id'],
                'username': user['username'],
                'ho_ten': user['ho_ten'],
                'vai_tro': user['vai_tro'],
                'email': user.get('email', ''),
                'dien_thoai': user.get('dien_thoai', '')
            }
            session['user_id'] = user['id']
            session['dien_thoai'] = user.get('dien_thoai', '')

            flash(f"Xin chào, {user['ho_ten']}!", 'success')
            if user['vai_tro'] == 'QUAN_TRI':
                return redirect(url_for('admin_rooms'))
            elif user['vai_tro'] == 'NHAN_VIEN':
                return redirect(url_for('staff_payment'))
            return redirect(url_for('home'))

        flash('Tên đăng nhập hoặc mật khẩu không chính xác.', 'danger')

    return render_template('auth/login.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        ho_ten = request.form.get('ho_ten', '').strip()
        username = request.form.get('username', '').strip()
        cccd = request.form.get('cccd', '').strip()
        dien_thoai = request.form.get('dien_thoai', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not ho_ten or not username or not password or not confirm_password:
            flash('Vui lòng điền đầy đủ các trường bắt buộc.', 'danger')
            return render_template('auth/register.html')

        if len(password) < 8:
            flash('Mật khẩu phải có tối thiểu 8 ký tự.', 'danger')
            return render_template('auth/register.html')

        if password != confirm_password:
            flash('Mật khẩu xác nhận không khớp.', 'danger')
            return render_template('auth/register.html')

        # Kiem tra dinh dang email co ban
        if email and not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            flash('Định dạng email không hợp lệ.', 'danger')
            return render_template('auth/register.html')

        # Kiem tra dinh dang so dien thoai (10 chu so)
        if dien_thoai and not re.match(r'^0\d{9,10}$', dien_thoai):
            flash('Số điện thoại không hợp lệ (cần bắt đầu bằng 0 và gồm 10 chữ số).', 'danger')
            return render_template('auth/register.html')

        # Kiem tra username khong phan biet hoa thuong
        if any(u['username'].lower() == username.lower() for u in DS_NGUOI_DUNG):
            flash('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.', 'danger')
            return render_template('auth/register.html')

        new_id = max(u['id'] for u in DS_NGUOI_DUNG) + 1
        new_user = {
            'id': new_id,
            'username': username,
            'password': generate_password_hash(password),
            'ho_ten': ho_ten,
            'cccd': cccd,
            'dien_thoai': dien_thoai,
            'email': email,
            'vai_tro': 'KHACH_HANG'
        }
        DS_NGUOI_DUNG.append(new_user)

        flash('Đăng ký tài khoản thành công! Quý khách có thể đăng nhập ngay.', 'success')
        return redirect(url_for('login'))

    return render_template('auth/register.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    flash('Đã đăng xuất khỏi hệ thống thành công.', 'info')
    return redirect(url_for('home'))

@app.route('/doi-mat-khau', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        old_password = request.form.get('old_password', '')
        new_password = request.form.get('new_password', '')
        confirm_new_password = request.form.get('confirm_new_password', '')

        user = next((u for u in DS_NGUOI_DUNG if u['id'] == session['user']['id']), None)
        if not user or not check_password_hash(user['password'], old_password):
            flash('Mật khẩu hiện tại không chính xác.', 'danger')
            return render_template('auth/change_password.html')

        if len(new_password) < 8:
            flash('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'danger')
            return render_template('auth/change_password.html')

        if new_password == old_password:
            flash('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'danger')
            return render_template('auth/change_password.html')

        if new_password != confirm_new_password:
            flash('Mật khẩu mới xác nhận không khớp.', 'danger')
            return render_template('auth/change_password.html')

        user['password'] = generate_password_hash(new_password)
        flash('Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới.', 'success')
        return redirect(url_for('home'))

    return render_template('auth/change_password.html')

# ==========================================
# STAFF ROUTES
# ==========================================

@app.route('/nhan-vien/thanh-toan', methods=['GET', 'POST'])
@staff_required
def staff_payment():
    so_phong = request.args.get('so_phong', '').strip()
    phieu_tim_thay = None
    chi_tiet = None

    if so_phong:
        # Tra cuu khop chinh xac so phong hoac ma phong
        for pt in DS_PHIEU_THUE:
            ten_khop = (pt['ten_phong'].lower() == f"phòng {so_phong}".lower() or 
                        pt['ten_phong'].lower() == so_phong.lower() or 
                        str(pt['phong_id']) == so_phong)
            if pt['trang_thai'] == 'CHUA_THANH_TOAN' and ten_khop:
                phieu_tim_thay = pt
                chi_tiet = tinh_tien_phong(pt)
                break

    if request.method == 'POST':
        ma_phieu = request.form.get('ma_phieu', '').strip()
        if not ma_phieu:
            flash('Mã phiếu thuê phòng không hợp lệ.', 'danger')
            return redirect(url_for('staff_payment'))

        phieu = next((pt for pt in DS_PHIEU_THUE if pt['ma_phieu'] == ma_phieu), None)
        if not phieu:
            flash('Không tìm thấy phiếu thuê phòng tương ứng.', 'danger')
            return redirect(url_for('staff_payment'))

        if phieu.get('trang_thai') == 'DA_THANH_TOAN':
            flash('Phiếu thuê này đã được thanh toán trước đó.', 'warning')
            return redirect(url_for('invoice_result', ma_hoa_don=phieu.get('ma_hoa_don')))

        phuong_thuc = request.form.get('phuong_thuc', 'TAI_QUAY')
        hoa_don = tao_hoa_don(phieu, phuong_thuc=phuong_thuc)

        # Cap nhat phong ve TRONG neu phong dang DANG_THUE
        phong = next((p for p in DS_PHONG if p['id'] == phieu['phong_id']), None)
        if phong and phong.get('tinh_trang') == 'DANG_THUE':
            phong['tinh_trang'] = 'TRONG'

        flash(f"Thanh toán thành công phiếu {ma_phieu}! Đã xuất hóa đơn {hoa_don['ma_hoa_don']}.", 'success')
        return redirect(url_for('invoice_result', ma_hoa_don=hoa_don['ma_hoa_don']))

    ds_phieu_chua_tt = [pt for pt in DS_PHIEU_THUE if pt.get('trang_thai') == 'CHUA_THANH_TOAN']
    return render_template(
        'payment/staff_payment.html',
        so_phong=so_phong,
        so_phong_tim=so_phong,
        phieu=phieu_tim_thay,
        chi_tiet=chi_tiet,
        ds_phieu_chua_tt=ds_phieu_chua_tt
    )

# ==========================================
# ADMIN ROUTES
# ==========================================

@app.route('/admin/phong')
@admin_required
def admin_rooms():
    tu_khoa = request.args.get('tu_khoa', '').strip().lower()
    loai_loc = request.args.get('loai', '').strip()
    tinh_trang_loc = request.args.get('tinh_trang', '').strip()

    ket_qua = DS_PHONG
    if tu_khoa:
        ket_qua = [p for p in ket_qua if tu_khoa in p['ten_phong'].lower() or tu_khoa in p['ghi_chu'].lower()]
    if loai_loc:
        ket_qua = [p for p in ket_qua if p['loai_phong'] == loai_loc]
    if tinh_trang_loc:
        ket_qua = [p for p in ket_qua if p['tinh_trang'] == tinh_trang_loc]

    return render_template(
        'admin/rooms.html',
        ds_phong=ket_qua,
        ds_loai_phong=DS_LOAI_PHONG,
        tu_khoa_hien_tai=request.args.get('tu_khoa', ''),
        loai_hien_tai=loai_loc,
        tinh_trang_hien_tai=tinh_trang_loc
    )

@app.route('/admin/phong/them', methods=['POST'])
@admin_required
def admin_add_room():
    ten_phong = request.form.get('ten_phong', '').strip()
    loai_phong = request.form.get('loai_phong', '').strip()
    don_gia = request.form.get('don_gia', type=int)
    tinh_trang = request.form.get('tinh_trang', 'TRONG').strip()
    ghi_chu = request.form.get('ghi_chu', '').strip()

    if not ten_phong:
        flash('Tên phòng không được để trống.', 'danger')
        return redirect(url_for('admin_rooms'))

    if loai_phong not in ['A', 'B', 'C']:
        flash('Loại phòng không hợp lệ (chỉ chấp nhận A, B, C).', 'danger')
        return redirect(url_for('admin_rooms'))

    if tinh_trang not in ['TRONG', 'DANG_THUE', 'BAO_TRI']:
        flash('Tình trạng phòng không hợp lệ.', 'danger')
        return redirect(url_for('admin_rooms'))

    if not don_gia or don_gia <= 0:
        lp = next((l for l in DS_LOAI_PHONG if l['id'] == loai_phong), None)
        don_gia = lp['don_gia'] if lp else 1000000

    new_id = max(p['id'] for p in DS_PHONG) + 1 if DS_PHONG else 101
    DS_PHONG.append({
        'id': new_id,
        'ten_phong': ten_phong,
        'loai_phong': loai_phong,
        'don_gia': don_gia,
        'tinh_trang': tinh_trang,
        'ghi_chu': ghi_chu,
        'anh_chinh': 'phong_101.jpg',
        'danh_sach_anh': ['phong_101.jpg'],
        'dien_tich': 40,
        'so_khach_tieu_chuan': 2,
        'so_khach_toi_da': 3,
        'tien_ich': ['Điều hòa', 'Wifi', 'Smart TV']
    })
    flash(f"Thêm phòng mới '{ten_phong}' thành công.", 'success')
    return redirect(url_for('admin_rooms'))

@app.route('/admin/phong/sua', methods=['POST'])
@admin_required
def admin_edit_room():
    room_id = request.form.get('id', type=int)
    phong = next((p for p in DS_PHONG if p['id'] == room_id), None)
    if not phong:
        abort(404)

    ten_phong = request.form.get('ten_phong', '').strip()
    loai_phong = request.form.get('loai_phong', '').strip()
    don_gia = request.form.get('don_gia', type=int)
    tinh_trang = request.form.get('tinh_trang', '').strip()
    ghi_chu = request.form.get('ghi_chu', '').strip()

    if not ten_phong:
        flash('Tên phòng không được để trống.', 'danger')
        return redirect(url_for('admin_rooms'))

    if loai_phong not in ['A', 'B', 'C']:
        flash('Loại phòng không hợp lệ.', 'danger')
        return redirect(url_for('admin_rooms'))

    if tinh_trang not in ['TRONG', 'DANG_THUE', 'BAO_TRI']:
        flash('Tình trạng phòng không hợp lệ.', 'danger')
        return redirect(url_for('admin_rooms'))

    # Chan doi phong co phieu chua thanh toan sang TRONG
    co_phieu_chua_tt = any(pt['phong_id'] == room_id and pt.get('trang_thai') == 'CHUA_THANH_TOAN' for pt in DS_PHIEU_THUE)
    if co_phieu_chua_tt and tinh_trang == 'TRONG':
        flash('Không thể chuyển phòng về trạng thái Trống khi phòng đang có phiếu thuê chưa thanh toán.', 'danger')
        return redirect(url_for('admin_rooms'))

    phong['ten_phong'] = ten_phong
    phong['loai_phong'] = loai_phong
    if don_gia and don_gia > 0:
        phong['don_gia'] = don_gia
    phong['tinh_trang'] = tinh_trang
    phong['ghi_chu'] = ghi_chu

    flash(f"Cập nhật thông tin '{ten_phong}' thành công.", 'success')
    return redirect(url_for('admin_rooms'))

@app.route('/admin/phong/xoa/<int:room_id>', methods=['POST'])
@admin_required
def admin_delete_room(room_id):
    phong = next((p for p in DS_PHONG if p['id'] == room_id), None)
    if not phong:
        abort(404)

    # Khong cho xoa phong dang co nguoi thue hoac co phieu chua thanh toan
    if phong['tinh_trang'] == 'DANG_THUE' or any(pt['phong_id'] == room_id and pt.get('trang_thai') == 'CHUA_THANH_TOAN' for pt in DS_PHIEU_THUE):
        flash('Không thể xóa phòng đang có khách thuê hoặc có phiếu thuê chưa thanh toán.', 'danger')
        return redirect(url_for('admin_rooms'))

    DS_PHONG.remove(phong)
    flash(f"Đã xóa thành công phòng {phong['ten_phong']}.", 'info')
    return redirect(url_for('admin_rooms'))

@app.route('/admin/khuyen-mai')
@admin_required
def admin_promotions():
    return render_template(
        'admin/promotions.html',
        ds_phong=DS_PHONG,
        ds_loai_phong=DS_LOAI_PHONG
    )

@app.route('/admin/bao-cao-doanh-thu')
@admin_required
def report_revenue():
    thang = request.args.get('thang', 11, type=int)
    nam = request.args.get('nam', 2026, type=int)

    # Validate thang va nam
    if thang < 1 or thang > 12:
        flash('Tháng không hợp lệ, hệ thống tự động đưa về tháng 11.', 'warning')
        thang = 11
    if nam < 2000 or nam > 2100:
        flash('Năm không hợp lệ, hệ thống tự động đưa về năm 2026.', 'warning')
        nam = 2026

    # Loc hoa don theo thang va nam
    hd_thang = [hd for hd in DS_HOA_DON if hd.get('thang') == thang and hd.get('nam') == nam]

    bang_doanh_thu = []
    tong_doanh_thu = sum(hd['chi_tiet']['tong_tien'] for hd in hd_thang)
    tong_luot_thue = len(hd_thang)

    for idx, lp in enumerate(DS_LOAI_PHONG, start=1):
        lp_id = lp['id']
        hd_loai = [hd for hd in hd_thang if hd['loai_phong'] == lp_id]
        doanh_thu_loai = sum(hd['chi_tiet']['tong_tien'] for hd in hd_loai)
        so_luot = len(hd_loai)
        ty_le = round((doanh_thu_loai / tong_doanh_thu * 100), 1) if tong_doanh_thu > 0 else 0.0

        bang_doanh_thu.append({
            'stt': idx,
            'loai_phong': lp['ten_loai'],
            'ma_loai': lp_id,
            'doanh_thu': doanh_thu_loai,
            'so_luot_thue': so_luot,
            'ty_le': ty_le
        })

    labels = [b['loai_phong'] for b in bang_doanh_thu]
    data_chart = [b['doanh_thu'] for b in bang_doanh_thu]

    return render_template(
        'admin/report_revenue.html',
        thang=thang,
        nam=nam,
        bang_doanh_thu=bang_doanh_thu,
        tong_doanh_thu=tong_doanh_thu,
        tong_luot_thue=tong_luot_thue,
        labels=labels,
        data_chart=data_chart,
        co_du_lieu=(tong_doanh_thu > 0),
        active_page='revenue'
    )

@app.route('/admin/bao-cao-mat-do')
@admin_required
def report_density():
    thang = request.args.get('thang', 11, type=int)
    nam = request.args.get('nam', 2026, type=int)

    # Validate thang va nam
    if thang < 1 or thang > 12:
        flash('Tháng không hợp lệ, hệ thống tự động đưa về tháng 11.', 'warning')
        thang = 11
    if nam < 2000 or nam > 2100:
        flash('Năm không hợp lệ, hệ thống tự động đưa về năm 2026.', 'warning')
        nam = 2026

    # Loc phieu thue trong thang va nam
    phieu_thang = [pt for pt in DS_PHIEU_THUE if pt.get('thang') == thang and pt.get('nam') == nam]

    co_du_lieu = len(phieu_thang) > 0
    bang_mat_do = []
    tong_so_ngay = sum(pt['so_ngay'] for pt in phieu_thang) if co_du_lieu else 0

    if co_du_lieu and tong_so_ngay > 0:
        for idx, p in enumerate(DS_PHONG, start=1):
            phieu_phong = [pt for pt in phieu_thang if pt['phong_id'] == p['id']]
            so_ngay = sum(pt['so_ngay'] for pt in phieu_phong)
            ty_le = round((so_ngay / tong_so_ngay * 100), 1)

            bang_mat_do.append({
                'stt': idx,
                'phong_id': p['id'],
                'ten_phong': p['ten_phong'],
                'loai_phong': p['loai_phong'],
                'so_ngay_thue': so_ngay,
                'ty_le': ty_le
            })

    labels = [b['ten_phong'] for b in bang_mat_do]
    data_chart = [b['so_ngay_thue'] for b in bang_mat_do]

    return render_template(
        'admin/report_density.html',
        thang=thang,
        nam=nam,
        co_du_lieu=co_du_lieu,
        bang_mat_do=bang_mat_do,
        tong_so_ngay=tong_so_ngay,
        labels=labels,
        data_chart=data_chart,
        active_page='density'
    )

# ==========================================
# ERROR HANDLERS
# ==========================================

@app.errorhandler(404)
def handle_404(e):
    return render_template('layouts/404.html'), 404

if __name__ == '__main__':
    debug_mode = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true")
    app.run(host='127.0.0.1', port=5000, debug=debug_mode)
