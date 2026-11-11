from sqlalchemy.engine import default
from sqlalchemy.testing.pickleable import User

from BackEnd import app, db
from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey, Enum, Date, Double
from sqlalchemy.orm import relationship
from enum import Enum as UserEnum

#Enum
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

class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True)

#Database Nhân Viên
class Employee(BaseModel):
    __tablename__ = "employee"
    name = Column(String(50), nullable=False)
    role = Column(Enum(EmployeeRole), nullable=False, default=EmployeeRole.USER)
    # -------Thiết Lập Mối Quan Hệ-------
    #hóa đơn
    receipt = relationship('Receipt',backref='employee_id',lazy=True)

#Database Khách Hàng
class Guest(BaseModel):
    __tablename__ = "guest"
    name = Column(String(50), nullable=False)
    cccd = Column(String(15), nullable=False, unique=True)
    type = Column(String(20), nullable=False,default = CategoryGuest.DOMESTIC)

    #-------Thiết Lập Mối Quan Hệ-------
    #phòng khách đang sử dụng
    current_room = relationship('CurrentGuestInRoom', backref='guest_id',lazy=True)
    #phiếu đặt phòng của khác
    ordered_ticket = relationship('OrderedRoomTicket',backref='guest_id',lazy=True)
    #hóa đơn
    receipt = relationship('Receipt', backref='guest_id', lazy=True)


#Database Phòng
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
    #số lượng khách trong phòng
    current_guest = relationship('CurrentGuestInRoom',backref='room_id',lazy=True)
    #phòng nằm trong phiếu đặt
    ordered_ticket = relationship('OrderedRoomTicket',backref='room_id',lazy=True)
    #hóa đơn
    receipt = relationship('Receipt',backref='room_id',lazy=True)

#Database Khách Trong Phong
class CurrentGuestInRoom(BaseModel):
    __tablename__ = "currentGuestInRoom"

    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)

#Database Phiếu Đặt Phòng
class OrderedRoomTicket(BaseModel):
    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)
    #ngày nhận
    check_in_date = Column(Date, nullable=False)
    #ngày trả
    check_out_date = Column(Date, nullable=False)

#Database Hóa Đơn
class Receipt(BaseModel):
    __tablename__ = "receipt"
    # -------Khai Báo Khóa Ngoại-------
    guest_id = Column(Integer, ForeignKey('guest.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employee.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('room.id'), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

