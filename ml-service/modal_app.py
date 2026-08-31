import modal

app = modal.App("grabpic-ml-service")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "libgl1",
        "libglib2.0-0",
    )
    .pip_install_from_requirements("requirements.txt")
    .run_commands(
        "python -c \"from deepface import DeepFace; DeepFace.build_model('Facenet512')\""
    )
    .add_local_dir("app", remote_path="/root/app")
)

@app.function(
    image=image,
    timeout=300,
)
@modal.asgi_app()
def web():
    from app.main import app as fastapi_app

    return fastapi_app