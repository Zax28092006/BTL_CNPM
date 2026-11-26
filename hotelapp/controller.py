from sqlalchemy.testing.pickleable import User

from hotelapp import db, app
from flask_sqlalchemy import SQLAlchemy
from hotelapp.model import Guest, Employee
import bcrypt

def hash_password(password):
    pw_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')


def register_guest(username, password,name, cccd,phone_number, nationality):
    password = hash_password(password)
    guest = Guest(username = username, name = name, password = str(password), cccd = cccd, phone_number = phone_number, nationality = nationality)

    db.session.add(guest)
    db.session.commit()

def register_employee(username, password, name, role):
    password = hash_password(password)
    employee = Employee(username = username, password = str(password), name = name, role = role)
    db.session.add(employee)
    db.session.commit()

def login_guest(username, password):
    guest_tmp = Guest.query.filter_by(username=username.strip()).first()
    if guest_tmp and bcrypt.checkpw(password.encode('utf-8'), guest_tmp.password.encode('utf-8')):
        return guest_tmp
    return None

def login_employee(username, password):
    password = hash_password(password)
    return Employee.query.filter(Employee.username.__eq__(username.strip()), Employee.password.__eq__(password)).first()

def get_guest_by_id(guest_id):
    return Guest.query.get(int(guest_id))

if __name__ == '__main__':
    with app.app_context():
        password1 = "123456"
        password2 = "123456"

        pw1_byte = password1.encode('utf-8')
        pw2_byte = password2.encode('utf-8')

        salt1 = bcrypt.gensalt(rounds=12)
        salt2 = bcrypt.gensalt(rounds=12)
        hashed_pw1 = bcrypt.hashpw(pw1_byte, salt1)
        hashed_pw2 = bcrypt.hashpw(pw2_byte, salt2)



        print(hashed_pw1)
        print(hashed_pw2)