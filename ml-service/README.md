# Face Search ML Service (CPU-only)

FastAPI-based microservice that:
- Accepts an image via URL or base64
- Detects faces
- Generates 512-dimensional embeddings using DeepFace (`model_name="Facenet512"`)
- Returns embeddings and bounding boxes as JSON
- Stateless, no DB / Redis / S3, CPU-only

## Folder structure

ml-service/
  app/
    __init__.py
    main.py
    schemas.py
    services/
      __init__.py
      face_embedding.py
  requirements.txt
  README.md



#######
Setup:

cd ml-service# (optional) create virtualenvpython -m venv .venvsource .venv/Scripts/activate  # on Windows PowerShell: .venv\Scripts\Activate.ps1pip install --upgrade pippip install -r requirements.txt

Run (development):

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

For production / Docker later, you can drop --reload and use the same app import
(app.main:app) in your CMD or process manager.

API:
POST /process
Request body:
{
  "imageUrl": "https://example.com/image.jpg",
  "imageBase64": null
}
or
{
  "imageUrl": null,
  "imageBase64": "BASE64_STRING_HERE"
}
At least one of imageUrl or imageBase64 must be provided.
Successful response (200):
{
  "faces": [
    {
      "embedding": [0.123, -0.045, ..., 0.089],
      "bbox": {
        "x": 100,
        "y": 80,
        "width": 64,
        "height": 64
      }
    }
  ]
}

embedding is always a list of 512 floats.
bbox is the face bounding box in pixel coordinates.

Error responses:
400 – invalid input or no face detected
500 – unexpected internal error while processing

---### Notes / how this meets your requirements- **FastAPI** app with `POST /process`.- **Input**: JSON with `imageUrl` and/or `imageBase64`; explicit 400 if both missing.- **Image handling**:  - `imageUrl` → downloaded via `httpx` and decoded with OpenCV.  - `imageBase64` → decoded and converted to OpenCV image.- **Model**: DeepFace with `model_name="Facenet512"` and `detector_backend="opencv"` (CPU-friendly).- **Faces & embeddings**:  - Uses `DeepFace.represent` to detect faces and get embeddings.  - Enforces exactly **512-dimensional** embeddings.  - Converts all embeddings to Python `float` lists → JSON-serializable.- **Error handling**:  - 400 for invalid inputs and “no face detected”.  - 500 for unexpected processing errors.- **Stateless**:  - No DB, Redis, S3, or other external state; only in-memory DeepFace / model caches.If you’d like, I can also sketch a minimal `Dockerfile` tailored to this layout for your future monorepo.
######