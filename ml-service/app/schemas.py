from typing import List, Optional

from pydantic import BaseModel, HttpUrl


class ProcessRequest(BaseModel):
    imageUrl: Optional[HttpUrl] = None
    imageBase64: Optional[str] = None


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class FaceEmbedding(BaseModel):
    embedding: List[float]  # always length 512
    bbox: BoundingBox


class ProcessResponse(BaseModel):
    faces: List[FaceEmbedding]