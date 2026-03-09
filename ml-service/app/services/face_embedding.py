import base64
import binascii
from typing import List, Dict, Any

import cv2
import httpx
import numpy as np
from deepface import DeepFace

from app.schemas import BoundingBox, FaceEmbedding


class NoFaceFoundError(Exception):
    """Raised when no face is detected in the image."""
    pass


def _decode_image_bytes_to_array(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a BGR OpenCV image."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes into an image.")
    return img


async def load_image_from_url(url: str) -> np.ndarray:
    """
    Download image from URL and convert to OpenCV BGR image.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ValueError(f"Failed to download image from URL: {exc}") from exc

    if not response.content:
        raise ValueError("Downloaded image from URL is empty.")

    return _decode_image_bytes_to_array(response.content)


def load_image_from_base64(image_b64: str) -> np.ndarray:
    """
    Decode base64-encoded image (optionally with data URL prefix) to OpenCV BGR image.
    """
    # Support data URLs like: "data:image/jpeg;base64,...."
    _, sep, data = image_b64.partition(",")
    if sep:  # there was a comma, so this is likely a data URL
        image_b64 = data

    try:
        image_bytes = base64.b64decode(image_b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 image data.") from exc

    if not image_bytes:
        raise ValueError("Base64 image data is empty.")

    return _decode_image_bytes_to_array(image_bytes)


def extract_faces_and_embeddings(img: np.ndarray) -> List[FaceEmbedding]:
    """
    Run face detection + embedding extraction using DeepFace (Facenet512).
    Ensures embeddings are 512-dimensional and JSON-serializable.
    """
    try:
        # DeepFace.represent returns a list of dicts (one per detected face)
        representations: List[Dict[str, Any]] = DeepFace.represent(
            img_path=img,
            model_name="Facenet512",
            enforce_detection=True,   # raise when no face is detected
            detector_backend="opencv"  # CPU-friendly backend
        )
    except ValueError as exc:
        # DeepFace uses ValueError when no face is detected
        raise NoFaceFoundError("No face detected in the image.") from exc

    faces: List[FaceEmbedding] = []

    for rep in representations:
        embedding = rep.get("embedding")
        facial_area = rep.get("facial_area") or rep.get("region")

        if embedding is None or facial_area is None:
            continue

        # Ensure 512-dimensional embedding
        if len(embedding) != 512:
            raise RuntimeError(
                f"Embedding dimension is {len(embedding)}, expected 512."
            )

        # DeepFace usually uses keys x, y, w, h
        x = int(facial_area.get("x", 0))
        y = int(facial_area.get("y", 0))
        width = int(facial_area.get("w") or facial_area.get("width") or 0)
        height = int(facial_area.get("h") or facial_area.get("height") or 0)

        bbox = BoundingBox(x=x, y=y, width=width, height=height)

        # Ensure JSON-serializable types (pure Python floats)
        emb_list = [float(v) for v in embedding]

        faces.append(FaceEmbedding(embedding=emb_list, bbox=bbox))

    if not faces:
        # No faces with valid embeddings
        raise NoFaceFoundError("No face detected in the image.")

    return faces