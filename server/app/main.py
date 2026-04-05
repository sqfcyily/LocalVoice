from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
from contextlib import asynccontextmanager

from app.api import jobs
from app.jobs.manager import worker
from app.tts.engine import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化 TTS 引擎
    # 优先从环境变量 MODEL_DIR 读取，如果没有则使用默认路径
    env_model_dir = os.environ.get("MODEL_DIR")
    if env_model_dir:
        models_dir = os.path.abspath(env_model_dir)
    else:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        models_dir = os.path.join(base_dir, "resources", "models")
        
    os.makedirs(models_dir, exist_ok=True)
    engine.initialize(models_dir)
    
    # 启动后台任务队列处理器
    task = asyncio.create_task(worker())
    yield
    # 关闭时清理
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)

base_dir = os.path.dirname(os.path.dirname(__file__))
outputs_dir = os.path.join(base_dir, "data", "outputs")
os.makedirs(outputs_dir, exist_ok=True)
app.mount("/api/outputs", StaticFiles(directory=outputs_dir), name="outputs")

web_dir = os.path.join(base_dir, "web")
if os.path.exists(web_dir):
    app.mount("/", StaticFiles(directory=web_dir, html=True), name="web")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=7860, reload=True)
