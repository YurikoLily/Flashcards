import csv
import io
import os
from datetime import datetime

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "flashcards.db")

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me")
app.config["ADMIN_USERNAME"] = os.getenv("ADMIN_USERNAME", "admin")
app.config["ADMIN_PASSWORD"] = os.getenv("ADMIN_PASSWORD", "flashcards")

db = SQLAlchemy(app)


class Flashcard(db.Model):
    __tablename__ = "flashcards"

    id = db.Column(db.Integer, primary_key=True)
    expression = db.Column(db.String(255), nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


def init_db():
    with app.app_context():
        db.create_all()


@app.context_processor
def inject_admin_status():
    return {"is_admin": session.get("is_admin", False)}


def is_logged_in() -> bool:
    return session.get("is_admin", False)


def require_login():
    if not is_logged_in():
        flash("请先登录管理员账号。", "warning")
        return redirect(url_for("login"))
    return None


@app.route("/")
def index():
    cards = Flashcard.query.order_by(Flashcard.created_at.desc()).all()
    return render_template("index.html", cards=cards)


@app.route("/admin/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if (
            username == app.config["ADMIN_USERNAME"]
            and password == app.config["ADMIN_PASSWORD"]
        ):
            session["is_admin"] = True
            flash("登录成功！", "success")
            return redirect(url_for("admin"))
        flash("用户名或密码错误。", "danger")
    return render_template("login.html")


@app.route("/admin/logout")
def logout():
    session.pop("is_admin", None)
    flash("已退出登录。", "info")
    return redirect(url_for("index"))


@app.route("/admin")
def admin():
    redirect_response = require_login()
    if redirect_response:
        return redirect_response

    cards = Flashcard.query.order_by(Flashcard.created_at.desc()).all()
    return render_template("admin.html", cards=cards)


@app.route("/admin/upload", methods=["POST"])
def upload_cards():
    redirect_response = require_login()
    if redirect_response:
        return redirect_response

    tsv_file = request.files.get("tsv_file")
    if not tsv_file or tsv_file.filename == "":
        flash("请选择一个TSV文件。", "warning")
        return redirect(url_for("admin"))

    try:
        decoded_stream = io.StringIO(tsv_file.stream.read().decode("utf-8"))
    except UnicodeDecodeError:
        flash("无法解析文件，请确保为UTF-8编码。", "danger")
        return redirect(url_for("admin"))

    reader = csv.reader(decoded_stream, delimiter="\t")
    rows = list(reader)

    if not rows:
        flash("TSV文件为空。", "warning")
        return redirect(url_for("admin"))

    # Remove header row if present
    rows = rows[1:]

    created_count = 0
    for row in rows:
        if len(row) < 2:
            continue
        expression, explanation = row[0].strip(), row[1].strip()
        if not expression or not explanation:
            continue
        card = Flashcard(expression=expression, explanation=explanation)
        db.session.add(card)
        created_count += 1

    if created_count:
        db.session.commit()
        flash(f"成功添加 {created_count} 条记录。", "success")
    else:
        flash("没有可导入的有效数据。", "info")

    return redirect(url_for("admin"))


@app.route("/admin/add", methods=["POST"])
def add_card():
    redirect_response = require_login()
    if redirect_response:
        return redirect_response

    expression = request.form.get("expression", "").strip()
    explanation = request.form.get("explanation", "").strip()

    if not expression or not explanation:
        flash("表达和解释不能为空。", "warning")
        return redirect(url_for("admin"))

    card = Flashcard(expression=expression, explanation=explanation)
    db.session.add(card)
    db.session.commit()
    flash("新增卡片成功。", "success")
    return redirect(url_for("admin"))


@app.route("/admin/delete/<int:card_id>", methods=["POST"])
def delete_card(card_id: int):
    redirect_response = require_login()
    if redirect_response:
        return redirect_response

    card = Flashcard.query.get_or_404(card_id)
    db.session.delete(card)
    db.session.commit()
    flash("卡片已删除。", "info")
    return redirect(url_for("admin"))


init_db()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
