# Grand Luxury Hotel - Frontend & Mock Flask Server

Dự án giao diện người dùng và máy chủ giả lập (Mock Server) cho hệ thống Quản lý Khách sạn Grand Luxury Hotel & Resort, phục vụ đồ án môn Công nghệ phần mềm.

## 1. Cấu trúc thư mục

```text
frontend/
├── .env.example              # Mẫu biến môi trường (SECRET_KEY, FLASK_DEBUG)
├── .gitignore                # Danh sách file và thư mục loại trừ khi đẩy Git
├── README.md                 # Tài liệu hướng dẫn cài đặt và bàn giao Backend
├── requirements.txt          # Khai báo các thư viện phụ thuộc (Flask, Werkzeug)
├── app.py                    # Mock Flask Server hoàn chỉnh kèm đánh dấu TODO Backend
├── static/
│   ├── css/
│   │   └── style.css         # Bảng kiểu giao diện cao cấp phong cách Grand Luxury
│   ├── js/
│   │   ├── promotions.js     # Xử lý giao diện quản lý khuyến mại và kiểm tra trùng lịch
│   │   ├── reports.js        # Vẽ biểu đồ doanh thu và mật độ sử dụng phòng (Chart.js)
│   │   ├── room_detail.js    # Chuyển đổi bộ sưu tập ảnh và chọn tiện ích phòng
│   │   ├── room_filter.js    # Lọc phòng mượt mà phía client không cần tải lại trang
│   │   └── rooms.js          # Xử lý bảng danh sách và modal quản lý phòng
│   └── img/                  # Ảnh nền hero_bg.jpg (đã tối ưu hóa gộp file) và ảnh phòng
├── templates/                # Hệ thống template Jinja2
│   ├── admin/                # Giao diện quản trị (phòng, báo cáo doanh thu/mật độ, khuyến mại)
│   ├── auth/                 # Giao diện đăng nhập, đăng ký, đổi mật khẩu
│   ├── client/               # Trang chủ, chi tiết phòng, phiếu đặt phòng
│   ├── layouts/              # Template nền tảng (base_client, base_admin, 404)
│   └── payment/              # Tra cứu phiếu thuê, thanh toán online, hóa đơn điện tử, thu tại quầy
└── tests/
    └── test_frontend.py      # Bộ 21 ca kiểm thử tự động kiểm tra bảo mật và logic
```

## 2. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- Python 3.9 trở lên
- Trình quản lý gói `pip`

### Các bước khởi chạy
1. Mở cửa sổ dòng lệnh tại thư mục `frontend/`.
2. Tạo và kích hoạt môi trường ảo (khuyến nghị):
   ```bash
   python -m venv .venv
   # Trên Windows:
   .venv\Scripts\activate
   # Trên Linux/macOS:
   source .venv/bin/activate
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
4. Cấu hình biến môi trường:
   Sao chép file `.env.example` thành `.env` (hoặc để trống, hệ thống sẽ tự sinh khóa bí mật ngẫu nhiên trong phiên chạy):
   ```bash
   cp .env.example .env
   ```
5. Khởi chạy máy chủ:
   ```bash
   python app.py
   ```
6. Truy cập ứng dụng tại địa chỉ: `http://127.0.0.1:5000`

---

## 3. Tài khoản thử nghiệm (Demo Mock Accounts)

| Vai trò | Tên đăng nhập | Mật khẩu mẫu | Họ và tên | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản Trị Viên Hệ Thống | Quản lý danh mục phòng, xem báo cáo doanh thu/mật độ, cấu hình khuyến mại |
| **Nhân viên lễ tân** | `nv_thungan` | `123456` | Lê Thu Ngân | Tra cứu phòng đang lưu trú, lập hóa đơn và thu tiền tại quầy |
| **Khách hàng** | `khachhang` | `123456` | Nguyễn Văn An | Đặt phòng trực tuyến, theo dõi phiếu thuê cá nhân, thanh toán online |

---

## 4. Bảng danh sách Route & API bàn giao cho Backend

Bảng hợp đồng kết nối giữa tầng Giao diện (Frontend) và tầng Dịch vụ dữ liệu (Backend):

| Phương thức | Đường dẫn (Route) | Phân quyền yêu cầu | Mô tả chức năng | Tham số nhận (Request Params / Form) | Kết quả trả về |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Công khai | Trang chủ, hiển thị danh sách phòng và lọc phía client | Không có | `client/home.html` |
| `GET` | `/phong/<room_id>` | Công khai | Xem chi tiết thông tin, tiện ích và ảnh của phòng | `room_id` (int) | `client/room_detail.html` hoặc `404` |
| `GET` | `/dat-phong` hoặc `/dat-phong/<room_id>` | Thành viên (`KHACH_HANG`) | Mở giao diện lập phiếu đặt phòng trực tuyến | `room_id` (int, tùy chọn) | `client/booking.html` |
| `POST` | `/dat-phong` | Thành viên (`KHACH_HANG`) | Tiếp nhận yêu cầu đặt phòng trực tuyến | `csrf_token`, `room_id`, `checkin_date`, `checkout_date`, `guest_count`, `booker_name`, `booker_phone`, `booker_email` | Chuyển hướng `/phieu-thue` kèm thông báo |
| `GET` | `/phieu-thue` | Thành viên (`KHACH_HANG`, `NHAN_VIEN`, `QUAN_TRI`) | Danh sách phiếu thuê phòng của người dùng đăng nhập | Không có | `payment/list_rentals.html` |
| `GET` | `/thanh-toan/<ma_phieu>` | Khách sở hữu (`KHACH_HANG`) | Trang kiểm tra chi phí và chọn phương thức thanh toán | `ma_phieu` (string) | `payment/checkout.html` hoặc `302` nếu sai quyền |
| `POST` | `/thanh-toan/xac-nhan/<ma_phieu>` | Khách sở hữu (`KHACH_HANG`) | Xác nhận kết quả thanh toán trực tuyến | `csrf_token`, `ket_qua` ('thanh_cong') | Chuyển hướng `/hoa-don/<ma_hd>` |
| `GET` | `/hoa-don/<ma_hoa_don>` | Khách sở hữu / Lễ tân / Quản trị | Xem và in hóa đơn điện tử | `ma_hoa_don` (string) | `payment/invoice_result.html` |
| `GET` | `/nhan-vien/thanh-toan` | `NHAN_VIEN`, `QUAN_TRI` | Giao diện thu ngân tra cứu và lập hóa đơn tại quầy | `so_phong` (string, tùy chọn) | `payment/staff_payment.html` |
| `POST` | `/nhan-vien/thanh-toan` | `NHAN_VIEN`, `QUAN_TRI` | Thực hiện lập hóa đơn và chuyển trạng thái phòng | `csrf_token`, `ma_phieu`, `phuong_thuc` | Chuyển hướng `/hoa-don/<ma_hd>` |
| `GET` | `/admin/phong` | `QUAN_TRI` | Quản lý danh mục phòng khách sạn | `tu_khoa`, `loai`, `tinh_trang` | `admin/rooms.html` |
| `POST` | `/admin/phong/them` | `QUAN_TRI` | Thêm mới một phòng vào hệ thống | `csrf_token`, `ten_phong`, `loai_phong`, `don_gia`, `tinh_trang`, `ghi_chu` | Chuyển hướng `/admin/phong` |
| `POST` | `/admin/phong/sua` | `QUAN_TRI` | Cập nhật thông tin phòng | `csrf_token`, `id`, `ten_phong`, `loai_phong`, `don_gia`, `tinh_trang`, `ghi_chu` | Chuyển hướng `/admin/phong` |
| `POST` | `/admin/phong/xoa/<room_id>` | `QUAN_TRI` | Xóa phòng (chặn khi phòng đang có khách hoặc phiếu chưa thanh toán) | `csrf_token`, `room_id` (int) | Chuyển hướng `/admin/phong` |
| `GET` | `/admin/khuyen-mai` | `QUAN_TRI` | Quản lý chính sách ưu đãi phòng (mô phỏng) | Không có | `admin/promotions.html` |
| `GET` | `/admin/bao-cao-doanh-thu` | `QUAN_TRI` | Thống kê doanh thu theo loại phòng theo tháng | `thang` (1..12), `nam` (>= 2000) | `admin/report_revenue.html` |
| `GET` | `/admin/bao-cao-mat-do` | `QUAN_TRI` | Thống kê mật độ sử dụng từng phòng theo tháng | `thang` (1..12), `nam` (>= 2000) | `admin/report_density.html` |
| `POST` | `/logout` | Mọi vai trò đã đăng nhập | Hủy phiên làm việc và đăng xuất an toàn | `csrf_token` | Chuyển hướng `/` |

---

## 5. Danh mục các điểm chờ đấu nối Backend (`# TODO: Backend`)

Trong file `app.py`, các vị trí cần thành viên Backend thay thế bằng truy vấn cơ sở dữ liệu MySQL đã được chú thích rõ ràng:

1. **`DS_NGUOI_DUNG`:** Thay thế bảng danh sách trong bộ nhớ bằng bảng `nguoi_dung` trong MySQL; sử dụng cột `password_hash` và kiểm tra mật khẩu bằng `werkzeug.security.check_password_hash`.
2. **`DS_LOAI_PHONG`:** Thay thế bằng bảng `loai_phong` (chứa mã loại, tên loại, đơn giá niêm yết, tỷ lệ phụ thu, hệ số khách quốc tế).
3. **`DS_PHONG`:** Thay thế bằng bảng `phong` (kèm trạng thái thực tế: `TRONG`, `DANG_THUE`, `BAO_TRI`).
4. **`DS_PHIEU_THUE`:** Thay thế bằng bảng `phieu_thue_phong` và bảng chi tiết khách lưu trú `chi_tiet_phieu_thue`.
5. **`DS_HOA_DON`:** Thay thế bằng bảng `hoa_don_thanh_toan` lưu trữ chi tiết số tiền cơ bản, phụ thu, hệ số và tổng thanh toán.
6. **`DS_PHIEU_DAT`:** Đấu nối lưu trữ các yêu cầu đặt phòng trực tuyến vào bảng `phieu_dat_phong` để nhân viên lễ tân tiếp nhận và duyệt nhận phòng.

---

## 6. Kết quả chạy bộ kiểm thử tự động (Unit Test Suite)

Chạy kiểm thử bằng lệnh:
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

Kết quả thực tế thực thi:
- **Tổng số ca kiểm thử:** 21 tests
- **Trạng thái:** 21/21 passed (OK)
- **Thời gian thực thi:** 0.541s
- **Các nhóm nội dung đã kiểm tra:**
  1. Xử lý mã lỗi `404 Not Found` trên các ID phòng không tồn tại.
  2. Phân quyền và điều hướng đúng chuẩn cho 4 vai trò (Khách vãng lai, Khách hàng, Thu ngân, Quản trị viên).
  3. Cơ chế chống lỗ hổng IDOR trên phiếu thuê và hóa đơn cá nhân.
  4. Xác thực mã bảo vệ CSRF trên mọi yêu cầu `POST`.
  5. Validate dữ liệu đầu vào: kiểm tra tính hợp lệ của ngày đặt phòng (không ở quá khứ, trả sau nhận, tối đa 28 ngày), quy định số lượng khách (1-3 người), định dạng email, số điện thoại và quy tắc cập nhật trạng thái phòng.
  6. Cơ chế chống thanh toán trùng lặp và tính toàn vẹn của mã hóa đơn.
  7. Độ chính xác của công thức tính tiền phòng theo 4 kịch bản quy định (cơ bản, phụ thu 25% khách thứ 3, hệ số 1.5 khách quốc tế, kết hợp cả hai).
  8. Tính nhất quán của số liệu giữa báo cáo doanh thu và báo cáo mật độ theo tháng.
