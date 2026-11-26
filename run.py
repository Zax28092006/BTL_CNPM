import hotelapp.model  # noqa: F401  (đăng ký các bảng với SQLAlchemy)
import hotelapp.index  # noqa: F401  (đăng ký các route)
from hotelapp import app, db

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="127.0.0.1", port=5000, debug=True)
