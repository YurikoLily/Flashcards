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

