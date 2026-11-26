from enum import Enum as UserEnum
from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from hotelapp import db, len_password
from flask_login import UserMixin


class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True, autoincrement=True)


# Enum
class CategoryGuest(UserEnum):
    DOMESTIC = 1
    FOREIGN = 2


class EmployeeRole(UserEnum):
    USER = 1
    ADMIN = 2


class RoomState(UserEnum):
    AVAILABLE = 1
    FULL = 2
    MAINTENANCE = 3
    RESERVED = 4


# Database Nhân Viên
class Employee(BaseModel,UserMixin):
    __tablename__ = "employee"
    name = Column(String(50), nullable=False)
    role = Column(Enum(EmployeeRole), nullable=False, default=EmployeeRole.USER)

    # -------Thông Tin Đăng Nhập-------
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(len_password), nullable=False)

    # -------Thiết Lập Mối Quan Hệ-------
    receipt = relationship('Receipt', backref='employee', lazy=True)


# Database Khách Hàng
class Guest(BaseModel,UserMixin):
    __tablename__ = "guest"
    name = Column(String(50), nullable=False)
    cccd = Column(String(15), nullable=False, unique=True)
    nationality = Column(String(50), nullable=False, default="Việt Nam")
    phone_number = Column(String(50), nullable=False)

    # -------Thông Tin Đăng Nhập-------
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(len_password), nullable=False)

    # -------Thiết Lập Mối Quan Hệ-------
    current_room = relationship('CurrentGuestInRoom', backref='guest', lazy=True)
    ordered_ticket = relationship('OrderedRoomTicket', backref='guest', lazy=True)
    receipt = relationship('Receipt', backref='guest', lazy=True)

    def __str__(self):
        return self.name


# Database Phòng
class Room(BaseModel):
    __tablename__ = "room"
    name = Column(String(50), nullable=False)
    price = Column(Float, default=0.0)
    state = Column(Enum(RoomState), nullable=False, default=RoomState.AVAILABLE)
    size = Column(Integer)
    floor_chua = Column(Integer)
    description = Column(Text)
    guest_count = Column(Integer)

    # -------Thiết Lập Mối Quan Hệ-------
    current_guest = relationship('CurrentGuestInRoom', backref='room', lazy=True)
    ordered_ticket = relationship('OrderedRoomTicket', backref='room', lazy=True)
    receipt = relationship('Receipt', backref='room', lazy=True)


# Database Khách Trong Phòng
class CurrentGuestInRoom(BaseModel):
    __tablename__ = "current_guest_in_room"

    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)


# Database Phiếu Đặt Phòng
class OrderedRoomTicket(BaseModel):
    __tablename__ = "ordered_room_ticket"
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)

    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)


# Database Hóa Đơn
class Receipt(BaseModel):
    __tablename__ = "receipt"
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)

    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employee.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)


if __name__ == "__main__":
    from hotelapp import app
    with app.app_context():
        db.create_all()