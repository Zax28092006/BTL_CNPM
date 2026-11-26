import os

from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from flask_login import LoginManager
app = Flask(__name__)
app.secret_key = "luxury-hotel-secret-key"
# Có thể ghi đè bằng biến môi trường DATABASE_URL (vd: sqlite:///hoteldb.db để chạy local)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://root:Mck28092006@localhost/hoteldb?charset=utf8mb4",
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True

db = SQLAlchemy(app=app)
login = LoginManager(app=app)

len_password = 100