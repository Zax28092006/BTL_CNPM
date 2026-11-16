from BackEnd import db, app
from flask_sqlalchemy import SQLAlchemy
from BackEnd.model import Guest, Employee
import bcrypt

def hash_password(password):
    password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))

def register_guest(username, password,name, cccd):
    guest = Guest(username = username, name = name, password = str(password), cccd = cccd)

    db.session.add(guest)
    db.session.commit()

def register_employee(username, password, name, role):
    password = hash_password(password)
    employee = Employee(username = username, password = str(password), name = name, role = role)
    db.session.add(employee)
    db.session.add(employee)

def login_guest(username, password):
    password = hash_password(password)
    return Guest.query.filter(Guest.username.__eq__(username.strip()), Guest.password.__eq__(password)).first()

def login_employee(username, password):
    password = hash_password(password)
    return Employee.query.filter(Employee.username.__eq__(username.strip()), Employee.password.__eq__(password)).first()


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