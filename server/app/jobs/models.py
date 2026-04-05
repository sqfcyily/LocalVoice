from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import uuid
import time

class JobInput(BaseModel):
    type: Literal["file", "folder"]
    path: str
    glob: Optional[List[str]] = None

class JobConfig(BaseModel):
    max_chars_per_segment: int = 300
    ignore_code_blocks: bool = True
    pause_ms_between_segments: int = 200

class JobCreateReq(BaseModel):
    inputs: List[JobInput]
    config: JobConfig = Field(default_factory=JobConfig)

class JobFileProgress(BaseModel):
    file_path: str
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    done_segments: int = 0
    total_segments: int = 0
    error: Optional[str] = None
    output_wav: Optional[str] = None

class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["queued", "running", "succeeded", "failed", "cancelled"] = "queued"
    config: JobConfig
    files: List[JobFileProgress] = []
    created_at: float = Field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: Optional[str] = None
    cancel_requested: bool = False
