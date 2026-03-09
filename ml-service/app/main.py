from fastapi import FastAPI, HTTPException
from starlette.concurrency import run_in_threadpool

from app.schemas import ProcessRequest, ProcessResponse
from app.services.face_embedding import (
    load_image_from_base64,
    load_image_from_url,
    extract_faces_and_embeddings,
    NoFaceFoundError,
)

app = FastAPI(
    title="Face Search ML Service",
    version="0.1.0",
    description="CPU-only FastAPI service for face detection and 512-dim embeddings using DeepFace (Facenet512).",
)


@app.get("/")
async def health_check():
    return {"status": "ok"}


@app.post("/process", response_model=ProcessResponse)
async def process_image(payload: ProcessRequest) -> ProcessResponse:
    """
    Accepts either imageUrl or imageBase64, detects faces,
    and returns Facenet512 embeddings + bounding boxes.
    """
    if not payload.imageUrl and not payload.imageBase64:
        # at least one must be present
        raise HTTPException(
            status_code=400,
            detail="Either imageUrl or imageBase64 must be provided.",
        )

    # 1. Load image into memory as an OpenCV BGR ndarray
    try:
        if payload.imageBase64:
            img = load_image_from_base64(payload.imageBase64)
        else:
            # mypy/helper assert for type narrowing
            assert payload.imageUrl is not None
            img = await load_image_from_url(str(payload.imageUrl))
    except ValueError as exc:
        # input-related errors -> 400
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # 2. Run DeepFace in a threadpool (it's CPU-bound and blocking)
    try:
        faces = await run_in_threadpool(extract_faces_and_embeddings, img)
    except NoFaceFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        # Catch-all for unexpected DeepFace / OpenCV errors
        raise HTTPException(
            status_code=500,
            detail="Failed to process image."
        )

    # 3. Return JSON-serializable response
    return ProcessResponse(faces=faces)