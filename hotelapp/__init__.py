from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from flask_login import LoginManager
app = Flask(__name__)
app.secret_key = "luxury-hotel-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:12345678@localhost/hoteldb?charset=utf8mb4"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True

db = SQLAlchemy(app=app)
login = LoginManager(app=app)

len_password = 100