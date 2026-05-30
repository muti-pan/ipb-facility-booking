import os
from uuid import uuid4
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
IMAGE_DIR = UPLOAD_DIR / "images"
PDF_DIR = UPLOAD_DIR / "pdfs"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
PDF_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_PDF_EXTENSIONS = {".pdf"}


def save_upload_file(file: UploadFile, target_dir: Path, allowed_ext: set[str]) -> str:
    filename = Path(file.filename).name
    extension = filename and Path(filename).suffix.lower()
    if not extension or extension not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"File tidak valid. Harus berekstensi: {', '.join(sorted(allowed_ext))}")

    unique_name = f"{uuid4().hex}{extension}"
    destination = target_dir / unique_name

    try:
        with destination.open("wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                buffer.write(chunk)
    finally:
        file.file.close()

    return unique_name


@router.post("/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    filename = save_upload_file(file, IMAGE_DIR, ALLOWED_IMAGE_EXTENSIONS)
    base_url = str(request.base_url).rstrip("/")
    return JSONResponse({"url": f"{base_url}/uploads/images/{filename}"})


@router.post("/pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    filename = save_upload_file(file, PDF_DIR, ALLOWED_PDF_EXTENSIONS)
    base_url = str(request.base_url).rstrip("/")
    return JSONResponse({"url": f"{base_url}/uploads/pdfs/{filename}"})
