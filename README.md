# Flashcards

一个用于将 TSV 文件转换为在线学习卡片的简易网站。支持上传双列表格（表达、解释），自动忽略首行表头，并将内容存储到数据库。管理员可以通过后台上传、添加或删除卡片。

## 功能概览

- 浏览所有已保存的学习卡片。
- 管理员登录后台后可上传 TSV 文件批量导入卡片。
- 自动忽略 TSV 文件第一行表头，仅导入实际数据。
- 后台支持手动添加单条卡片与删除任意卡片。
- 数据持久化保存至 SQLite 数据库 `flashcards.db`。

## 快速开始

1. 创建虚拟环境并安装依赖：

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. 配置管理员账号（可选）：

   默认用户名为 `admin`，密码为 `flashcards`。你可以通过环境变量覆盖：

   ```bash
   export ADMIN_USERNAME="your_name"
   export ADMIN_PASSWORD="your_password"
   export SECRET_KEY="random-secret"
   ```

3. 运行应用：

   ```bash
   flask --app app.py run --debug
   ```

   首次启动会自动在项目根目录创建 `flashcards.db` 数据库文件。

4. 访问：

   - 前台卡片列表：<http://localhost:5000/>
   - 管理员后台：<http://localhost:5000/admin>

## TSV 文件格式

- 需为 UTF-8 编码的制表符分隔文本。
- 第 1 行作为表头会被自动忽略。
- 第 1 列：表达；第 2 列：解释。

示例：

```
表达	解释
apple	苹果，一种水果
book	书籍，用于阅读
```

## 部署建议

- 使用环境变量设置强密码。
- 考虑将应用部署在支持 WSGI 的服务器上，如 gunicorn + nginx。
- 如需多用户协作，可进一步扩展用户体系与权限管理。

### Vercel 部署

项目已经包含 `vercel.json` 配置，可直接使用 [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python) 部署。关键步骤如下：

1. 为项目启用持久化数据库。Vercel 的函数执行环境不支持在本地文件系统中长期保存 SQLite 文件，因此请准备一个可远程访问的数据库（如 Vercel Postgres、Neon、Railway 等），并获取其连接字符串。
2. 在 Vercel 控制台的 **Environment Variables** 中配置：
   - `DATABASE_URL`：数据库连接字符串，例如 `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`。如果你的服务提供的是 `postgres://...` 前缀，应用会自动转换为 SQLAlchemy 可识别的 `postgresql://`。
   - `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SECRET_KEY` 等保密信息。
3. 执行 `vercel` 或在 Vercel 控制台导入仓库后进行部署。`vercel.json` 会把所有请求路由到 `app.py`，从而运行 Flask 应用。

部署完成后，应用会在启动时自动创建缺失的数据库表。若遇到连接问题，请确认数据库支持通过公网访问，并已允许来自 Vercel 的连接。
