## NL to SQL 智能数据分析系统 - Phase 1

本项目实现了系统规划 `system_plan_1.0` 的 **Phase 1**：搭建 FastAPI + SQLite3 后端骨架与 React 前端骨架，并通过 `/health` 完成前后端联通测试。

### 目录结构（当前阶段）

- `backend/`：FastAPI + SQLite3 后端
  - `app/main.py`：应用入口，提供 `GET /health` 接口
  - `app/core/config.py`：基础配置与预留百炼 Qwen3 配置位
  - `app/db/session.py`：SQLite 数据库引擎与会话工厂（预留给后续业务）
  - `requirements.txt`：后端依赖
- `frontend/`：基于 Vite + React 的前端
  - `src/App.tsx`：展示后端健康状态的主页
  - `src/services/api.ts`：封装 `/health` 调用

---

### 一、后端启动（FastAPI + SQLite3）

1. 进入后端目录并创建虚拟环境（可选但推荐）：

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows PowerShell
   ```

2. 安装依赖：

   ```bash
   pip install -r requirements.txt
   ```

3. 启动 FastAPI 应用（开发模式，带热重载）：

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. 健康检查验证：
   - 在浏览器访问：`http://localhost:8000/health`
   - 预期返回：

     ```json
     { "status": "ok" }
     ```

> 说明：`app/db/session.py` 已配置 `sqlite:///./app.db`，后续 Phase 3 可基于此创建业务表结构。

---

### 二、前端启动（React + Vite）

1. 进入前端目录：

   ```bash
   cd frontend
   ```

2. 安装依赖：

   ```bash
   npm install
   # 或
   pnpm install
   # 或
   yarn install
   ```

3. 启动前端开发服务器：

   ```bash
   npm run dev
   # 默认端口 5173
   ```

4. 打开浏览器访问：`http://localhost:5173`
   - 页面中央卡片区域会显示「后端健康状态：后端在线/离线」
   - 当前端能够成功调用 `http://localhost:8000/health` 且返回 `{ "status": "ok" }` 时，会显示 **后端在线**。

> 如需修改后端地址，可在前端 `.env` 中配置：
>
> ```bash
> VITE_BACKEND_URL=http://localhost:8000
> ```

---

### 三、与后续 Phase 的衔接

- Phase 1 已完成：
  - 后端基础骨架（FastAPI + SQLite3 连接预留）。
  - 前端基础骨架（React + Vite）。
  - `/health` 健康检查接口与前端联通展示。
- 后续 Phase 2/3/4 可在此基础上继续：
  - 扩展后端路由与数据库 schema。
  - 在前端增加三栏布局和会话/聊天/图表区域。
  - 接入百炼 Qwen3 与 LangChain，实现 NL → SQL 主链路。

