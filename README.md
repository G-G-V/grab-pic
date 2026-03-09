# GrabPic

AI-powered event photo retrieval system using facial recognition.
Users upload event photos, and attendees can find their photos by uploading a selfie.

---

# Tech Stack

Frontend

- React
- Tailwind
- shadcn/ui

Backend

- Node.js (Express)

Database

- PostgreSQL
- pgvector

ML Service

- FastAPI
- DeepFace (FaceNet512)

Infrastructure

- Redis (BullMQ workers)
- AWS S3 (photo storage)
- Docker

---

# Project Structure

// Ignore tests for now.

grab-pic
│
├── frontend
├── backend
│ ├── src
│ ├── prisma
│ └── tests
│
├── ml-service
│
├── docker-compose.yml
└── README.md

---

# Local Development Setup

## 1️⃣ Start Database + Redis (Docker)

From project root:

docker compose up -d

This starts:

- PostgreSQL with pgvector
- Redis for BullMQ

Check running containers:

docker compose ps

Stop containers:

docker compose down

Reset database completely:

docker compose down -v

---

## 2️⃣ Backend Environment

Create:

backend/.env

Example:

DATABASE_URL="postgresql://grabpic_user:grabpic_pass@localhost:5432/grabpic_db"

JWT_SECRET="your-secret"
PORT=3000

REDIS_URL="redis://localhost:6379"

ML_SERVICE_URL="http://localhost:8000
"

AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
S3_BUCKET_NAME=""

---

## 3️⃣ Prisma Setup

Install dependencies:

cd backend
npm install

Run migrations:

npx prisma migrate dev

Generate Prisma client:

npx prisma generate

---

## 4️⃣ Run Backend

npm run dev

Server will start at:

http://localhost:3000

Health check:

/health

---

## 5️⃣ ML Service (Optional for now)

cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload

Runs on:

http://localhost:8000

---

# Notes

- pgvector extension is installed automatically via migrations.
- The `faces` table contains a `vector(512)` embedding column.
- A high-performance `ivfflat` index is created for similarity search.

---

# Development Workflow

1. Create feature branch
2. Implement feature
3. Commit changes
4. Open pull request

---

# Future Components

- S3 photo storage
- BullMQ background workers
- Face embedding pipeline
- Vector similarity search
