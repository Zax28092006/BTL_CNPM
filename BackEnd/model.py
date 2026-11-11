from sqlalchemy.engine import default
from sqlalchemy.testing.pickleable import User

from BackEnd import app, db
from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey, Enum, Date, Double
from sqlalchemy.orm import relationship
from enum import Enum as UserEnum

#Enum
class NhanVienRole(UserEnum):
    USER = 1
    ADMIN = 2

class PhongState(UserEnum):
    AVAILABLE = 1
    FULL = 2
    MAINTENANCE = 3
    RESERVED = 4

class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True)
#Database Nhân Viên
class NhanVien(BaseModel):
    __tablename__ = "nhanVien"
    name = Column(String(50), nullable=False)
    chuc_vu = Column(Enum(NhanVienRole), nullable=False, default=User.USER)

#Database Khách Hàng
class KhachHang(BaseModel):
    __tablename__ = "khachHang"
    name = Column(String(50), nullable=False)
    cccd = Column(String(15), nullable=False, unique=True)
    type = Column(String(20), nullable=False,default = 'KhachHangNoiDia')

#Database Phòng
class Phong(BaseModel):
    __tablename__ = "phong"
    name = Column(String(50), nullable=False)
    price = Column(Float, default=0.0)
    state = Column(Enum(PhongState), nullable=False, default=PhongState.AVAILABLE)
    suc_chua = Column(Integer)
    floor_chua = Column(Integer)
    decription = Column(Text)
    so_khach_trong_phong = Column(Integer)




if __name__ == "__main__":
    with app.app_context():
        app.run(debug=True)

