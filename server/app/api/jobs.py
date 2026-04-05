from fastapi import APIRouter, HTTPException
from typing import List
from app.jobs.models import JobCreateReq, Job
from app.jobs.manager import create_job, cancel_job, JOBS

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=Job)
def api_create_job(req: JobCreateReq):
    job = create_job(req)
    return job

@router.get("", response_model=List[Job])
def api_list_jobs(status: str = None):
    jobs = list(JOBS.values())
    if status:
        jobs = [j for j in jobs if j.status == status]
    return sorted(jobs, key=lambda j: j.created_at, reverse=True)

@router.get("/{job_id}", response_model=Job)
def api_get_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOBS[job_id]

@router.post("/{job_id}/cancel")
def api_cancel_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    cancel_job(job_id)
    return {"status": "cancelling"}
