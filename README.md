# LocalVoice (V2.0 Ultimate Architecture)

**纯离线、本地轻量运行的中英双语 TTS 转换工具。**
> 放弃复杂的 ffmpeg 和拼接逻辑，直接使用 `sherpa-onnx` 中英双语原生 VITS 模型，实现 Token 级中英无缝混读、零冷冻时间流式 WAV 写入。
> 前端使用 React + Tailwind 构建性感看板，后端使用 FastAPI + 原生异步队列驱动。

---

## 🚀 快速开始指南

你刚刚 clone 了这份性感的代码，现在是时候让它在你的机器上苏醒了！
因为这是一个前后端分离的架构，第一步，你**绝对必须**先安装两端的依赖。

### 1. 准备后端环境 (Python 引擎与队列)

为了不弄脏你宿主机的环境，我们强烈建议使用虚拟环境！

```bash
cd server

# 1. 创建并激活虚拟环境 (根据你的系统选择)
python -m venv venv
source venv/bin/activate     # macOS / Linux
# venv\Scripts\activate      # Windows

# 2. 安装核心依赖
pip install -r requirements.txt
```

### 2. 准备前端环境 (React UI)

```bash
cd web

# 使用 npm 安装前端依赖
npm install
```

### 3. 初始化 TTS 模型 (如果需要)

为了让你能“开箱即用”，仓库中已经挂载了一个轻量级测试模型子模块（位于 `server/resources/models/vits-zh-hf-fanchen-c`）。
如果在 clone 时你没有拉取子模块，请执行：

```bash
git submodule update --init --recursive
```

*(如果你想使用自己下载的 Sherpa-onnx 模型，只需将其解压放入 `server/resources/models/` 目录即可，引擎会在启动时自动扫描 `*.onnx` 权重与词典。)*

---

## 🏃‍♂️ 启动服务

安装完依赖后，我们需要同时启动后端和前端。开两个终端窗口吧！

### 终端 1: 唤醒后端核心

```bash
cd server
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload
```
*当看到 `TTS 引擎初始化成功` 的日志时，说明这头性能怪兽已经饥渴难耐了。*

### 终端 2: 点亮前端看板

```bash
cd web
npm run dev
```
*然后，点击终端里输出的本地链接（通常是 `http://localhost:5173`），你就能看到那个专门为你打造的美观操作界面了。*

---

## 📦 终极打包 (Nuitka)

当你想把这个系统分发给其他人，而不是让他们痛苦地敲命令行时，你可以使用我们预置的 Nuitka 脚本。

1. 先把前端构建成静态文件：
   ```bash
   cd web
   npm run build
   ```
   *(产物会生成在 `web/dist`，并在打包时被强行塞进后端的二进制文件里)*
   
2. 运行打包脚本：
   ```bash
   cd server
   bash build.sh
   ```
   *(Nuitka 将把你所有的 Python 逻辑编译为 C 语言扩展，最终在 `dist` 目录下生成一个无需依赖、极速启动的单可执行文件！)*
