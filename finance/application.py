import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session, url_for
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime
import pytz
from pytz import timezone

from helpers import apology, login_required, lookup, usd

# Retrieving my timezone
fmt = "%Y-%m-%d %H:%M:%S"
now_utc = datetime.now(timezone('Asia/Singapore'))

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")

# Make sure API key is set
if not os.environ.get("API_KEY"):
    raise RuntimeError("API_KEY not set")

@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""
    # Querying for the stocks user has bought/sold
    rows = db.execute("SELECT Symbol, Name, Shares, Price, Total_Price FROM portfolio WHERE users_id=:userid",userid=session["user_id"])

    # Updating the current stock prices of the stocks user owns
    db.execute("DELETE FROM currentStockPrice")

    # Storing the stocks detail in another table
    for row in rows:
        quoted_symbol = lookup(row["Symbol"])
        symbol = quoted_symbol["symbol"]
        name = quoted_symbol["name"]
        shares = row["Shares"]

        currentPrice = quoted_symbol["price"]
        totalCurrentPrice = currentPrice * shares
        db.execute("INSERT INTO currentStockPrice VALUES(:symbol,:name,:shares,:cp,:tcp)",
        symbol=symbol, name=name, shares=shares, cp=currentPrice, tcp=totalCurrentPrice)

    # Querying for 'Portfolio' Table
    rows_pfl = db.execute("SELECT symbol, name, shares, ROUND(price,2) as roundedprice, ROUND(totalPrice,2) as roundedtotalPrice FROM currentStockPrice")

    # Querying for balance cash
    cash_prompt = db.execute("SELECT cash FROM users WHERE id=:userid",userid=session["user_id"])
    cash_display = float(cash_prompt[0]["cash"])

    return render_template("index.html", rows_pfl=rows_pfl, cash=cash_display)

@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stocks"""
    if request.method == "GET":
        return render_template("buy.html")
    else:
        # Looking up stock symbol
        try:
            if not request.form.get("symbol") or not request.form.get("qty"):
                return apology("Must provide symbol/quantity", 403)
            quoted_symbol = lookup(request.form.get("symbol"))
            symbol = quoted_symbol["symbol"]
            name = quoted_symbol["name"]
            current_price = quoted_symbol['price']
            qty = int(request.form.get("qty"))
            total_price = qty * current_price
        except:
            return apology("Sorry, there is no such symbol.")
        finally:
            # More error checking
            if quoted_symbol == None:
                return apology("Sorry, there is no such symbol.")
            elif qty < 0:
                return apology("Please enter a valid number.")
            elif session["user_cash"] < total_price:
                return apology("You do not have enough cash.")

            # Update balance cash after buying a stock
            session["user_cash"] -= total_price
            db.execute("UPDATE users SET cash=:cash WHERE id=:userid", cash=session["user_cash"], userid=session["user_id"])

            # Recording transaction inside a table
            share_count = '+' + str(qty)
            db.execute("INSERT INTO transactions VALUES(:userid,:symbol,:name,:shares,:price,:dates)",
            userid=session["user_id"], symbol=symbol, name=name, shares=share_count, price=current_price, dates=now_utc.strftime(fmt))

            # Searching through user's portfolio to see if he/she has owned the particular stock or not and update it if so
            found = False
            rows = db.execute("SELECT Symbol, Shares, Price FROM portfolio WHERE users_id=:userid", userid=session["user_id"])
            for row in rows:
                if symbol == row["Symbol"]:
                    found = True
                    qty2 = row['Shares']
                    shares = qty2 + qty
                    db.execute("UPDATE portfolio SET Shares=:shares WHERE Symbol=:symbol AND users_id=:userid",
                    shares=shares, symbol=symbol, userid=session["user_id"])

            # Add stock into portfolio if stock is not owned
            if found == False:
                db.execute("INSERT INTO portfolio(users_id,Symbol,Name,Shares,Price,Total_Price) VALUES(:userid,:symbol,:name,:shares,:price,:totalprice)",
                userid=session["user_id"], symbol=symbol, name=name, shares=qty, price=current_price, totalprice=total_price)
            flash('Bought Succesfully!')
            return redirect(url_for('index'))


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    # Querying for the stocks user has bought/sold
    rows_transac = db.execute("SELECT * FROM transactions WHERE userid=:userid",userid=session["user_id"])
    rows_cashtransac = db.execute("SELECT * FROM cashtransac WHERE userid=:userid",userid=session["user_id"])
    return render_template("history.html", rows_transac=rows_transac, rows_cashtransac=rows_cashtransac)


@app.route("/change_password", methods=["GET","POST"])
@login_required
def changepassword():
    """Allow users to change their passwords"""
    if request.method == "GET":
        return render_template("changePW.html")
    else:
        # Prompting user to key in their old PW
        oldpassword = request.form.get("oldpassword")

        # Error checking
        if not oldpassword:
            return apology("Please enter a password.")

        # Query database for user hash password
        rows = db.execute("SELECT hash FROM users WHERE id = :userid",userid=session["user_id"])

        # Ensure old password entered is correct
        if not check_password_hash(rows[0]["hash"], oldpassword):
            return apology("Invalid old password", 403)

        newpassword = request.form.get("newpassword")
        cfm_newpassword = request.form.get("cfm_newpassword")

        # Error checking
        if cfm_newpassword != newpassword:
            return apology("Sorry, your password does not match your confirm password.")
        elif not newpassword or not cfm_newpassword:
            return apology("Please enter a password.")

        # Hash the new password
        newpassword_hash = generate_password_hash(newpassword)

        # Update hash in SQL
        db.execute("UPDATE users SET hash=:hashed WHERE id=:userid",
        hashed=newpassword_hash, userid=session["user_id"])

        # Return to homepage
        flash('Password Changed!')
        return redirect(url_for('index'))


@app.route("/deposit", methods=["GET","POST"])
@login_required
def deposits():
    if request.method == "GET":
        return render_template("deposit.html")
    else:
        try:
            deposit = int(request.form.get("deposit"))

            # Error Checking
            if not deposit or deposit <= 0:
                return apology("Invalid Amount")

            # Querying for user's current cash balance
            rows = db.execute("SELECT cash FROM users WHERE id=:userid", userid=session["user_id"])
            current_cash = rows[0]["cash"]

            # Update cash balance
            cash = current_cash + deposit
            db.execute("UPDATE users SET cash=:cash WHERE id=:userid", cash=cash, userid=session["user_id"])

            # Recording transaction inside a table
            db.execute("INSERT INTO cashtransac VALUES(:userid,:activity,:amount,:usercash,:dates)",
            userid=session["user_id"], activity='Deposit', amount=deposit, usercash=cash, dates=now_utc.strftime(fmt))

            # Return to homepage
            flash('$' + str(deposit) + ' has been deposited into your account!')
            return redirect(url_for('index'))

        except:
            return apology("Invalid Amount")


@app.route("/withdraw", methods=["GET","POST"])
@login_required
def withdrawal():
    if request.method == "GET":
        return render_template("withdraw.html")
    else:
        try:
            withdraw = int(request.form.get("withdraw"))

            # Error Checking
            if not withdraw or withdraw <= 0:
                return apology("Invalid Amount!")
            elif withdraw > session["user_cash"]:
                return apology("Exceeded current available amount!")

            # Querying for user's current cash balance
            rows = db.execute("SELECT cash FROM users WHERE id=:userid", userid=session["user_id"])
            current_cash = rows[0]["cash"]

            # Update cash balance
            cash = current_cash - withdraw
            db.execute("UPDATE users SET cash=:cash WHERE id=:userid", cash=cash, userid=session["user_id"])

            # Recording transaction inside a table
            db.execute("INSERT INTO cashtransac VALUES(:userid,:activity,:amount,:usercash,:dates)",
            userid=session["user_id"], activity='Withdraw', amount=withdraw, usercash=cash, dates=now_utc.strftime(fmt))

            # Return to homepage
            flash('$' + str(withdraw) + ' has been withdrawn from your account!')
            return redirect(url_for('index'))

        except:
            return apology("Invalid Amount!")


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("Must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("Must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("Invalid username and/or password", 403)

        # Remember which user has logged in and user's cash
        session["user_id"] = rows[0]["id"]
        session["user_cash"] = rows[0]["cash"]

        # Redirect user to home page
        flash('You were successfully logged in')
        return redirect(url_for('index'))

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    flash('You were successfully logged out')
    return render_template("login.html")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    if request.method == "GET":
        return render_template("quote.html")
    else:
        quoted_symbol = lookup(request.form.get("symbol"))

        # Error checking and returning the result
        if quoted_symbol == None:
            return apology("Sorry, there is no such symbol.")
        else:
            return render_template("quoted.html",
            name=quoted_symbol['name'],price=quoted_symbol['price'],symbol=quoted_symbol['symbol'])


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user"""
    if request.method == "GET":
        return render_template("register.html")
    else:
        # Prompting user for their informations
        username = request.form.get("username")
        password = request.form.get("password")
        cfm_pw = request.form.get("cfm_password")

        # Require users’ passwords to have at least 2 letters, numbers, and 1 symbol
        letters2 = False
        symbol1 = False
        count = 0
        for i in password:
            if i.isalpha() == True:
                count += 1
            if count == 2:
                letters2 = True
                break
        if set('[~!@#$%^&*()_+{}":;\']+$').intersection(password):
            symbol1 = True
        if letters2 == False:
            return apology("Sorry, your password requires at least 2 alphabets")
        if symbol1 == False:
            return apology("Sorry, your password requires at least 1 symbol")

        # Error checking and storing user's information
        if password != cfm_pw:
            return apology("Sorry, your password does not match your confirm password.")
        elif not username:
            return apology("Please enter a username.")
        elif not password or not cfm_pw:
            return apology("Please enter a password.")
        else:
            # Hashing the password
            pw_hash = generate_password_hash(password)
            try:
                db.execute("INSERT INTO users(username, hash) VALUES (:username, :hash)", username=username, hash=pw_hash)
            except RuntimeError:
                return apology("Sorry, your username has been used.")
            finally:
                flash('Registered Succesfully!')
                return render_template("login.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    if request.method == "GET":
        return render_template("sell.html")
    else:
        # Displaying the current stocks in user's portfolio
        stockHoldings = db.execute("SELECT Symbol FROM portfolio WHERE users_id=:userid",userid=session["user_id"])

        # Checking statements to ensure correct inputs from user
        try:
            quoted_symbol = lookup(request.form.get("symbol"))
            symbol = quoted_symbol["symbol"]
            name = quoted_symbol["name"]
            sell_price = quoted_symbol["price"]
            qty = int(request.form.get("qty"))
        except:
            return apology("Sorry, there is no such symbol.")
        finally:
            # More error checking
            if quoted_symbol == None:
                return apology("Sorry, there is no such symbol.")
            elif qty < 0:
                return apology("Please enter a valid number.")
            found = False
            for stock in stockHoldings:
                if symbol == stock["Symbol"]:
                    found = True
                    # Recording transaction inside a table
                    share_count = '-' + str(qty)
                    db.execute("INSERT INTO transactions VALUES(:userid,:symbol,:name,:shares,:price,:dates)",
                    userid=session["user_id"], symbol=symbol, name=name, shares=share_count, price=sell_price, dates=now_utc.strftime(fmt))

                    # Updating the user balance cash
                    total_cashback = qty * sell_price
                    session["user_cash"] += total_cashback
                    db.execute("UPDATE users SET cash=:cash WHERE id=:userid", cash=session["user_cash"], userid=session["user_id"])

                    # Updating the user share count

                    # Searching through the portfolio for the quoted stock symbol
                    rows = db.execute("SELECT Symbol, Shares, Price FROM portfolio WHERE users_id=:userid", userid=session["user_id"])
                    for row in rows:
                        if symbol == row["Symbol"]:
                            qty2 = row["Shares"]
                            shares = qty2 - qty
                            if qty > qty2:
                                return apology("You do not have the specified number of stocks")
                            db.execute("UPDATE portfolio SET Shares=:shares WHERE Symbol=:symbol AND users_id=:userid",
                            shares=shares, symbol=symbol, userid=session["user_id"])
                    flash('Sold Succesfully!')
                    return redirect(url_for('index'))
            if found == False:
                return apology("Sorry, you do not have this stock in your portfolio.")


def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)

if __name__ == "__main__":
    app.run(debug=True)