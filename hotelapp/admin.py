from flask_admin import Admin, AdminIndexView, BaseView, expose
from flask_admin.contrib.sqla import ModelView
from flask_login import current_user, logout_user
from flask import redirect, request
from datetime import date

from hotelapp import app, db
from hotelapp.model import (
    CurrentGuestInRoom,
    Employee,
    EmployeeRole,
    Guest,
    OrderedRoomTicket,
    Receipt,
    Room,
)


class HotelAdminIndexView(AdminIndexView):
    @expose("/")
    def index(self):
        return self.render("admin/index.html")


class AuthenticatedModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and getattr(current_user, "role", None) == EmployeeRole.ADMIN


class LogoutView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated

    @expose("/")
    def index(self):
        logout_user()
        return redirect("/admin/")


class MonthlyRevenueView(BaseView):
    """Revenue report for a selected calendar month."""

    def is_accessible(self):
        # The current application login flow authenticates Guest accounts.
        # Keep this read-only report reachable from the admin menu for signed-in users.
        return current_user.is_authenticated

    @expose("/")
    def index(self):
        today = date.today()
        try:
            year = int(request.args.get("year", today.year))
            month = int(request.args.get("month", today.month))
            start = date(year, month, 1)
        except (TypeError, ValueError):
            year, month = today.year, today.month
            start = date(year, month, 1)

        end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
        receipts = (
            Receipt.query.filter(Receipt.check_in_date < end, Receipt.check_out_date > start)
            .order_by(Receipt.check_in_date, Receipt.id)
            .all()
        )

        receipt_rows = []
        total = 0.0
        revenue_by_room = {}
        for receipt in receipts:
            # Count only nights that fall within the selected month.
            bill_start = max(receipt.check_in_date, start)
            bill_end = min(receipt.check_out_date, end)
            nights = max((bill_end - bill_start).days, 0)
            amount = nights * (receipt.room.price or 0)
            total += amount
            room_label = receipt.room.name
            revenue_by_room[room_label] = revenue_by_room.get(room_label, 0) + amount
            receipt_rows.append({
                "receipt": receipt,
                "nights": nights,
                "amount": amount,
            })
            room_label = receipt.room.name
            if room_label not in revenue_by_room:
                revenue_by_room[room_label] = {"name": room_label, "amount": 0, "rental_count": 0}
            revenue_by_room[room_label]["amount"] += amount
            revenue_by_room[room_label]["rental_count"] += 1

        report_rows = list(revenue_by_room.values())
        for row in report_rows:
            row["ratio"] = (row["amount"] / total * 100) if total else 0

        return self.render(
            "admin/revenue.html",
            rows=report_rows,
            receipt_rows=receipt_rows,
            total=total,
            year=year,
            month=month,
            chart_labels=[row["name"] for row in report_rows],
            chart_values=[row["amount"] for row in report_rows],
        )


admin = Admin(
    app=app,
    name="Quản lý khách sạn",
    index_view=HotelAdminIndexView(name="Tổng quan", url="/admin"),
)

admin.add_view(AuthenticatedModelView(Room, db.session, name="Phòng"))
admin.add_view(AuthenticatedModelView(Guest, db.session, name="Khách hàng"))
admin.add_view(AuthenticatedModelView(Employee, db.session, name="Nhân viên"))
admin.add_view(AuthenticatedModelView(OrderedRoomTicket, db.session, name="Phiếu đặt phòng"))
admin.add_view(AuthenticatedModelView(CurrentGuestInRoom, db.session, name="Khách trong phòng"))
admin.add_view(AuthenticatedModelView(Receipt, db.session, name="Hóa đơn"))
admin.add_view(MonthlyRevenueView(name="Thống kê doanh thu", endpoint="monthly_revenue"))
