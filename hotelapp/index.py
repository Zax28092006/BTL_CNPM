from hotelapp import app, controller, login
from flask import render_template, request, redirect, session
from flask_login import login_user, login_required, logout_user


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_view():
    return render_template('login.html')

@app.route('/register')
def register_view():
    return render_template('register.html')

@app.route('/register',methods=['POST'])
def register_guest():
    name = request.form.get('name')
    username = request.form.get('username')
    password = request.form.get('password')
    confirm = request.form.get('confirm')
    nationality = request.form.get('nationality')
    cccd = request.form.get('cccd')
    phone_number = request.form.get('phone_number')
    mgs = ''
    if not password or not confirm or password != confirm:
        mgs = 'Mật khẩu Không Trùng Khớp'
    else:
        data = request.form.copy()
        del data['confirm']

        controller.register_guest(**data)
        return render_template('login.html')

    return render_template('register.html',mgs=mgs)

@app.route('/login',methods=['POST'])
def login_guest():
    username = request.form.get('username')
    password = request.form.get('password')
    mgs = ''

    u = controller.login_guest(username, password)
    if u:
        login_user(user=u)
        return redirect('/')
    else:
        return redirect('/login')

@app.route('/logout')
def logout_view():
    logout_user()
    return redirect('/')

@login.user_loader
def load_user(user_id):
    return controller.get_guest_by_id(user_id)

if __name__ == '__main__':
    with app.app_context():
        from hotelapp import admin
        app.run(debug=True)
