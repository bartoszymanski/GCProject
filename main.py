import datetime
from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
import requests
from flask_login import UserMixin
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import Length, EqualTo, Email, DataRequired, ValidationError
from flask_cors import CORS
import os
from google.cloud.logging.handlers import StructuredLogHandler
from google.cloud.logging import Client

class RegisterForm(FlaskForm):
    def validate_username(self, username_to_check):
        user = User.query.filter_by(username=username_to_check.data).first()
        if user:
            raise ValidationError('Username already exists! Please try a different username')

    def validate_email_address(self, email_address_to_check):
        email_address = User.query.filter_by(email_address=email_address_to_check.data).first()
        if email_address:
            raise ValidationError('Email Address already exists! Please try a different email address')

    username = StringField(validators=[Length(min=2, max=30), DataRequired()])
    email_address = StringField(validators=[Email(), DataRequired()])
    password1 = PasswordField(validators=[Length(min=6), DataRequired()])
    password2 = PasswordField(validators=[EqualTo('password1'), DataRequired()])
    submit = SubmitField(label="Reg ister")


class LoginForm(FlaskForm):
    username = StringField(validators=[DataRequired()])
    password = PasswordField(validators=[DataRequired()])
    submit = SubmitField(label="Log in")

def monkey_patch_collections():
    import collections
    import collections.abc
    collections.Sequence = collections.abc.Sequence

monkey_patch_collections()

app = Flask(__name__, template_folder='./templates', static_folder='./static')
CORS(app)
app.debug = True
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(length=30), nullable=False, unique=True)
    email_address = db.Column(db.String(length=50), nullable=False, unique=True)
    password_hash = db.Column(db.String(length=60), nullable=False)
    wallet = db.relationship('Wallet', back_populates="user", lazy=True)

    @property
    def password(self):
        return self.password

    @password.setter
    def password(self, plain_text_password):
        self.password_hash = bcrypt.generate_password_hash(plain_text_password).decode('utf-8')

    def check_password_correction(self, attempted_password):
        return bcrypt.check_password_hash(self.password_hash, attempted_password)


class Wallet(db.Model):
    __tablename__ = 'wallet'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    amount = db.Column(db.DECIMAL(6, 2))
    transaction_at = db.Column(db.DateTime(), nullable=False, default=datetime.datetime.now)
    user = db.relationship("User", back_populates="wallet", lazy=False)

with app.app_context():
        db.create_all()
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "login_page"
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

client = Client()
handler = StructuredLogHandler()
app.logger.addHandler(handler)

def log_endpoint_call(endpoint, status):
    log_data = {
        "endpoint": endpoint,
        "status": status,
        "message": f"Endpoint {endpoint} accessed with status {status}"
    }
    app.logger.info(log_data)

@app.route('/')
@app.route('/home')
def home_page():
    app.logger.info(f"User {current_user.username if current_user.is_authenticated else 'Anonymous'} accessed 'home_page'.")
    log_endpoint_call("home", 200)
    body = requests.get('https://api.frankfurter.app/latest?from=EUR&to=PLN')
    response = body.json()
    euros = round(response["rates"]["PLN"], 2)
    body = requests.get('https://api.frankfurter.app/latest?from=USD&to=PLN')
    response = body.json()
    dollar = round(response["rates"]["PLN"], 2)
    body = requests.get('https://api.frankfurter.app/latest?from=GBP&to=PLN')
    response = body.json()
    funt = round(response["rates"]["PLN"], 2)
    body = requests.get('https://api.frankfurter.app/latest?from=CAD&to=PLN')
    response = body.json()
    cad = round(response["rates"]["PLN"], 2)
    date = str(response["date"])
    return render_template('index.html', eur=euros, usd=dollar, funt=funt, cad=cad, today=date)


@app.route('/graphs')
def graphs_page():
    app.logger.info(f"User {current_user.username if current_user.is_authenticated else 'Anonymous'} accessed 'graphs_page'.")
    log_endpoint_call("graph", 200)
    return render_template('graphs.html')


@app.route('/login', methods=['GET', 'POST'])
def login_page():
    form = LoginForm()
    if form.validate_on_submit():
        attempted_user = User.query.filter_by(username=form.username.data).first()
        if attempted_user and attempted_user.check_password_correction(
                attempted_password=form.password.data
        ):
            login_user(attempted_user)
            app.logger.info(f"User {attempted_user.username} logged in successfully.")
            flash(f'Success! You are logged in as: {attempted_user.username}', category='success')
            return redirect(url_for('home_page'))
        else:
            app.logger.warning(f"Failed login attempt for username: {form.username.data}")
            flash('Username and password are not match! Please try again', category='danger')
    app.logger.info(f"Login page accessed.")
    log_endpoint_call("login", 200)
    return render_template('login.html', form=form)


@app.route('/signin', methods=['GET', 'POST'])
def signin_page():
    form = RegisterForm()
    if form.validate_on_submit():
        user_to_create = User(username=form.username.data,
                                email_address=form.email_address.data,
                                password=form.password1.data)
        db.session.add(user_to_create)
        db.session.commit()
        login_user(user_to_create)
        app.logger.info(f"New user {user_to_create.username} registered and logged in.")
        log_endpoint_call("signin", 200)
        waluty = ["PLN", "GBP", "USD", "CAD"]
        for w in waluty:
            if w == "USD":
                obj_to = Wallet(user_id=current_user.id, currency_code="USD", amount=100)
            else:
                obj_to = Wallet(user_id=current_user.id, currency_code=w, amount=0)
            db.session.add(obj_to)
            db.session.commit()
        flash(f"Account created successfully! You are now logged in as {user_to_create.username}", category='success')
        return redirect(url_for('home_page'))
    if form.errors != {}:
        for err_msg in form.errors.values():
            app.logger.error(f"Error creating user: {err_msg}")
            flash(f'There was an error with creating a user: {err_msg}', category='danger')
    app.logger.info(f"Signin page accessed.")
    return render_template('signin.html', form=form)


@app.route('/profile', methods=['POST'])
@login_required
def profile_page():
    data = request.get_json(force=True)
    if data:
        quer = f'SELECT * FROM wallet WHERE (currency_code="{data["code_1"]}" AND user_id = "{current_user.id}");'
        app.logger.info(f"User {current_user.username} initiated a transaction.")
        log_endpoint_call("profile", 200)
        wallets = db.session.execute(quer)
        amount_in_wallet = [float(t.amount) for t in wallets]
        sum_in_curr = sum(amount_in_wallet)
        if float(sum_in_curr) >= float(data['content']):
            rate_dict = requests.get(
                f"https://api.frankfurter.app/latest?amount={data['content']}&from={data['code_1']}&to={data['code_2']}").json()
            rate = float(rate_dict['rates'][data['code_2']])
            obj_from = Wallet(user_id=current_user.id, currency_code=data['code_1'], amount=-round(float(data['content']), 2))
            obj_to = Wallet(user_id=current_user.id, currency_code=data['code_2'], amount=round(rate, 2))
            db.session.add(obj_from)
            db.session.commit()
            db.session.add(obj_to)
            db.session.commit()
            return '', 204
        else:
            return 'Transaction refused.', 400
    else:
        return 'Transaction refused.', 400


@app.route('/profile')
@login_required
def profile_page_get():
    query0 = 'SELECT transaction_at FROM wallet WHERE user_id = :user_id AND currency_code="USD" AND amount=100;'
    starter = db.session.execute(query0, {'user_id': current_user.id}).fetchall()
    if not starter:
        return "No transactions for this user with USD 100", 404

    start_date_obj = starter[0].transaction_at

    date_str = start_date_obj.strftime("%Y-%m-%d")

    rate_dict = requests.get(f"https://api.frankfurter.app/{date_str}?from=USD&to=PLN").json()
    rate = float(rate_dict['rates']['PLN']) * 100

    query1 = 'SELECT currency_code FROM wallet WHERE user_id = :user_id;'
    codes_in_wallet = db.session.execute(query1, {'user_id': current_user.id}).fetchall()
    currencies = list(set([row.currency_code for row in codes_in_wallet]))

    dict_wal = {}
    balance = 0
    for curr in currencies:
        quer = 'SELECT amount FROM wallet WHERE currency_code = :curr AND user_id = :user_id;'
        wallets = db.session.execute(quer, {'curr': curr, 'user_id': current_user.id}).fetchall()
        amount_in_wallet = [float(t.amount) for t in wallets]
        sum_in_curr = sum(amount_in_wallet)
        dict_wal[curr] = round(sum_in_curr, 2)

        if 'PLN' not in curr:
            xd = f'https://api.frankfurter.app/latest?from={curr}&to=PLN'
            response = requests.get(xd).json()
            value = round(response["rates"]["PLN"], 2)
        else:
            value = 1
        balance += sum_in_curr * value

    balance = round(balance, 2)
    profit = round(((balance - rate)/rate), 3) * 100

    query2 = 'SELECT transaction_at, currency_code, amount FROM wallet WHERE user_id = :user_id;'
    all_transactions = db.session.execute(query2, {'user_id': current_user.id}).fetchall()
    history = []
    for row in all_transactions:
        if row.amount != 0:
            formatted_date = row.transaction_at.strftime("%Y-%m-%d %H:%M:%S")
            history_dict = {
                'date': formatted_date,
                'code': row.currency_code,
                'amount': round(row.amount, 2)
            }
            history.append(history_dict)

    return render_template('profile.html', dict_wal=dict_wal, balance=balance, hist=history[::-1], profit=round(profit, 3))


@app.route('/table')
def table_page():
    app.logger.info(f"User {current_user.username if current_user.is_authenticated else 'Anonymous'} accessed 'table_page'.")
    log_endpoint_call("table", 200)
    body = requests.get('https://api.frankfurter.app/latest?from=EUR&to=PLN')
    response = body.json()
    date = str(response["date"])
    return render_template('table.html', today=date)


@app.route('/logout')
def logout_page():
    log_endpoint_call("logout", 200)
    if current_user.is_authenticated:
        app.logger.info(f"User {current_user.username} logged out.")
    else:
        app.logger.info(f"Anonymous user attempted to access 'logout_page'.")
    logout_user()
    flash("You have been logged out!", category='info')
    return redirect(url_for("home_page"))


if __name__ == '__main__':
    app.run()
